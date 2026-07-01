import type { Template } from "@daml/types";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { Ticket, GiftOffer, ResaleOffer, DvPResaleOffer } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { SyndicatedLoan, TrancheOffer, FinancingOffering } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Tix";
import type { LedgerContract, QueryableLedger } from "./ledgerSession.js";
import type { KydDb } from "./db.js";
import { metrics } from "./metrics.js";

// Poll-and-diff over the operator session's ACS view. The classic JSON API
// this server talks to has no offset-based transaction stream a browser-less
// poller can cheaply resume, so the diff against our own indexed_contracts
// table IS the event detection: a contract id we've never stored was
// created since last poll, a stored-active id missing from the snapshot was
// archived. Correct as long as contract ids never recycle — which Daml
// guarantees.

type NameResolver = (eventId: string) => string;

interface DerivedNotification {
  party: string;
  kind: string;
  title: string;
  body: string;
}

interface Watched {
  templateId: string;
  query(ledger: QueryableLedger): Promise<LedgerContract<unknown>[]>;
  onNew?(payload: unknown, eventName: NameResolver): DerivedNotification | null;
  onArchived?(payload: unknown, eventName: NameResolver): DerivedNotification | null;
}

// Captures the template's payload type once so the per-template hooks below
// are written against the real generated bindings, not `any`.
function watch<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  hooks: {
    onNew?: (payload: T, eventName: NameResolver) => DerivedNotification | null;
    onArchived?: (payload: T, eventName: NameResolver) => DerivedNotification | null;
  } = {},
): Watched {
  return {
    templateId: template.templateId,
    query: (ledger) => ledger.query(template),
    onNew: hooks.onNew && ((p, r) => hooks.onNew!(p as T, r)),
    onArchived: hooks.onArchived && ((p, r) => hooks.onArchived!(p as T, r)),
  };
}

// Notification targets are derived ONLY from parties the payload names
// explicitly (recipient/buyer/owner) — never inferred from who might be
// watching — so a notification can't leak an offer to a party the contract
// itself wouldn't disclose to.
const WATCHED: Watched[] = [
  watch(Event),
  watch(TierAllocation),
  watch(Ticket, {
    onNew: (t, eventName) => ({
      party: t.owner,
      kind: "ticket_delivered",
      title: `Your ticket to ${eventName(t.eventId)}`,
      body: `Ticket ${t.tierId} #${t.serial} for ${eventName(t.eventId)} is now in your wallet.`,
    }),
  }),
  watch(GiftOffer, {
    onNew: (o, eventName) => ({
      party: o.recipient,
      kind: "offer_received",
      title: `You've been offered a ticket to ${eventName(o.ticket.eventId)}`,
      body: `Ticket ${o.ticket.tierId} #${o.ticket.serial} is waiting for you to accept.`,
    }),
    onArchived: (o, eventName) => ({
      party: o.recipient,
      kind: "offer_closed",
      title: `Ticket offer closed for ${eventName(o.ticket.eventId)}`,
      body: `The offer for ticket ${o.ticket.tierId} #${o.ticket.serial} is no longer open.`,
    }),
  }),
  watch(ResaleOffer, {
    onNew: (o, eventName) => ({
      party: o.buyer,
      kind: "offer_received",
      title: `Resale offer for ${eventName(o.ticket.eventId)}`,
      body: `You can buy ticket ${o.ticket.tierId} #${o.ticket.serial} for ${o.salePrice}.`,
    }),
    onArchived: (o, eventName) => ({
      party: o.buyer,
      kind: "offer_closed",
      title: `Resale offer closed for ${eventName(o.ticket.eventId)}`,
      body: `The resale of ticket ${o.ticket.tierId} #${o.ticket.serial} is no longer open.`,
    }),
  }),
  watch(DvPResaleOffer, {
    onNew: (o, eventName) => ({
      party: o.buyer,
      kind: "offer_received",
      title: `Resale offer for ${eventName(o.ticket.eventId)}`,
      body: `You can buy ticket ${o.ticket.tierId} #${o.ticket.serial} for ${o.salePrice} (atomic settlement).`,
    }),
    onArchived: (o, eventName) => ({
      party: o.buyer,
      kind: "offer_closed",
      title: `Resale offer closed for ${eventName(o.ticket.eventId)}`,
      body: `The resale of ticket ${o.ticket.tierId} #${o.ticket.serial} is no longer open.`,
    }),
  }),
  watch(TrancheOffer, {
    onNew: (o, eventName) => ({
      party: o.buyer,
      kind: "offer_received",
      title: `Loan tranche offered for ${eventName(o.eventId)}`,
      body: `${o.seller} offers a ${o.faceAmount} face-value tranche for ${o.price}.`,
    }),
    onArchived: (o, eventName) => ({
      party: o.buyer,
      kind: "offer_closed",
      title: `Tranche offer closed for ${eventName(o.eventId)}`,
      body: `The tranche offer from ${o.seller} is no longer open.`,
    }),
  }),
  // Indexed for the analytics summary and the read model, but no
  // notifications: loans and offerings are multi-party structures whose
  // payload doesn't say which single party a transition "happened to".
  watch(SyndicatedLoan),
  watch(FinancingOffering),
];

const BASELINE_KEY = "baseline_done";

export class Indexer {
  private readonly now: () => number;
  private timer: NodeJS.Timeout | null = null;
  private lastLoggedError: string | null = null;
  private readonly runs = metrics.counter("indexer_runs_total", "Indexer poll runs, by result.");
  private readonly lastRun = metrics.gauge(
    "indexer_last_run_timestamp_seconds",
    "Epoch seconds of the last successful indexer run.",
  );
  private readonly created = metrics.counter("notifications_created_total", "Notifications derived, by kind.");

  constructor(
    private readonly ledger: QueryableLedger,
    private readonly db: KydDb,
    opts: { now?: () => number } = {},
  ) {
    this.now = opts.now ?? Date.now;
  }

  // Never throws: this is the interval callback's body, and an unhandled
  // rejection from setInterval would take the whole server down (same class
  // of failure asyncRoute.ts exists for). Errors go to indexer_state so
  // /healthz and /metrics can surface them; the log line is de-duplicated so
  // an outage doesn't produce one stack trace per poll.
  async runOnce(): Promise<void> {
    try {
      await this.poll();
      this.lastLoggedError = null;
      this.db.setIndexerState("last_error", "");
      this.runs.inc({ result: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message !== this.lastLoggedError) {
        console.error(`[indexer] poll failed: ${message}`);
        this.lastLoggedError = message;
      }
      this.db.setIndexerState("last_error", message);
      this.runs.inc({ result: "error" });
    }
  }

  private async poll(): Promise<void> {
    // Query everything BEFORE writing anything: a half-fetched snapshot must
    // not mark the unfetched half's contracts as archived.
    const snapshots = await Promise.all(WATCHED.map((w) => w.query(this.ledger)));
    const nowMs = this.now();

    // First successful run just records the pre-existing world — replaying
    // history as "new" would greet every user with a wall of stale
    // notifications for contracts they made themselves.
    const baseline = this.db.getIndexerState(BASELINE_KEY) === null;

    const eventNames = new Map<string, string>();
    for (const c of snapshots[WATCHED.findIndex((w) => w.templateId === Event.templateId)]) {
      const payload = c.payload as { eventId: string; name: string };
      eventNames.set(payload.eventId, payload.name);
    }
    const eventName: NameResolver = (eventId) => eventNames.get(eventId) ?? eventId;

    for (let i = 0; i < WATCHED.length; i++) {
      const w = WATCHED[i];
      const contracts = snapshots[i];
      for (const c of contracts) {
        const isNew = this.db.upsertContract(c.contractId, w.templateId, c.payload, nowMs);
        if (isNew && !baseline && w.onNew) {
          this.notify(w.onNew(c.payload, eventName), c.contractId, nowMs);
        }
      }
      const archived = this.db.markArchivedExcept(
        w.templateId,
        contracts.map((c) => c.contractId),
        nowMs,
      );
      if (!baseline && w.onArchived) {
        for (const a of archived) this.notify(w.onArchived(a.payload, eventName), a.contractId, nowMs);
      }
    }

    if (baseline) this.db.setIndexerState(BASELINE_KEY, "1");
    const nowSeconds = Math.floor(nowMs / 1000);
    this.db.setIndexerState("last_run_at", String(nowSeconds));
    this.lastRun.set(nowSeconds);
  }

  private notify(derived: DerivedNotification | null, contractId: string, nowMs: number): void {
    if (!derived) return;
    this.db.insertNotification(
      { party: derived.party, kind: derived.kind, title: derived.title, body: derived.body, contractId },
      nowMs,
    );
    this.created.inc({ kind: derived.kind });
  }

  start(intervalMs: number): void {
    if (this.timer) return;
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), intervalMs);
    // Polling must never be the thing keeping the process alive.
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
