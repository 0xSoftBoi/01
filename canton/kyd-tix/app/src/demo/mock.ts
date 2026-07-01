// A self-contained, in-browser simulation of the Canton backend for the
// hosted demo (Vercel serves the static frontend only — there is no live
// Canton participant, JSON API or server behind it there). This module
// reimplements, in plain TypeScript, exactly the slice of Kyd.Event,
// Kyd.Ticket, Kyd.Cash and Kyd.Tix's choices the app actually exercises, plus
// the two operator triggers (Kyd.Triggers.autoFillOrders, sweepRevenue) as
// setInterval loops — so the UI behaves the same as it does against the real
// stack (same seed data as Kyd.Demo:setup, same demand-curve pricing, same
// pro-rata loan paydown), without a real ledger underneath it.
//
// The seam is `MockLedger`, which implements the three methods
// (query/create/exercise) that api.ts's ledger-generic helpers (useQuery,
// exactNote, placeOrder) already call — so those helpers run completely
// unmodified against it. loadDemoParties/topUp (plain async functions) and
// mockLedger/partyForRole (plain values) are the demo counterparts to the
// functions that talk to the network directly in the real implementation —
// api.ts owns all the actual React hooks, calling straight into these.
import type Ledger from "@daml/ledger";
import { Cash } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Cash";
import { Event, PurchaseOrder, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { GiftOffer, ResaleOffer, Ticket } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { SyndicatedLoan } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Tix";
import { RevenueShare } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Settlement";
import type { DemoParties, RoleKey } from "../api";
import type { AppNotification } from "../notifications";

// ---------------------------------------------------------------------------
// Identities — same hint shape as Kyd.Demo:setup's allocatePartyWithHint.

const P: DemoParties = {
  operator: "KYD-Operator::demo",
  venue: "Brooklyn-Bowl::demo",
  artist: "Robert-Plant::demo",
  alice: "Alice::demo",
  bob: "Bob::demo",
  lender: "Lender-A::demo",
  lender2: "Lender-B::demo",
};

function partyForRole(role: RoleKey): string {
  switch (role) {
    case "alice":
      return P.alice;
    case "bob":
      return P.bob;
    case "venue":
      return P.venue;
    case "artist":
      return P.artist;
  }
}

// ---------------------------------------------------------------------------
// Contract store — plain arrays of {contractId, payload}, mutated in place by
// the choice handlers below. useQuery already polls ledger.query() every
// 800ms, so mutating these arrays is all "reactivity" needs.

interface Contract<T> {
  contractId: string;
  payload: T;
}

interface Store {
  events: Contract<Event>[];
  allocs: Contract<TierAllocation>[];
  tickets: Contract<Ticket>[];
  orders: Contract<PurchaseOrder>[];
  resaleOffers: Contract<ResaleOffer>[];
  giftOffers: Contract<GiftOffer>[];
  cash: Contract<Cash>[];
  loans: Contract<SyndicatedLoan>[];
  receipts: Contract<RevenueShare>[];
}

let counter = 0;
function nextId(kind: string): string {
  counter += 1;
  return `mock:${kind}:${counter}`;
}

function buildSeed(): Store {
  const now = Date.now();
  const show1Time = new Date(now + 3 * 3600 * 1000).toISOString();
  const show2Time = new Date(Date.UTC(2026, 8, 1, 23, 0, 0)).toISOString();

  // Matches Kyd.Demo:setup exactly: two GA shards + one VIP shard opened on
  // SHOW-001 (so allocated starts at 10/5), one GA shard on SHOW-002.
  const events: Contract<Event>[] = [
    {
      contractId: nextId("Event"),
      payload: {
        operator: P.operator,
        venue: P.venue,
        artist: P.artist,
        eventId: "SHOW-001",
        name: "Robert Plant — Live at Brooklyn Bowl",
        eventTime: show1Time,
        royaltyBps: 1000,
        financingShareBps: 5000,
        tiers: [
          { tierId: "GA", basePrice: "50.0000000000", demandBps: 200, resaleCapBps: 15000, supply: 200, allocated: 10 },
          { tierId: "VIP", basePrice: "150.0000000000", demandBps: 0, resaleCapBps: 12000, supply: 20, allocated: 5 },
        ],
      } as unknown as Event,
    },
    {
      contractId: nextId("Event"),
      payload: {
        operator: P.operator,
        venue: P.venue,
        artist: P.artist,
        eventId: "SHOW-002",
        name: "Late Night — Secret Set",
        eventTime: show2Time,
        royaltyBps: 1000,
        financingShareBps: 0,
        tiers: [{ tierId: "GA", basePrice: "25.0000000000", demandBps: 0, resaleCapBps: 15000, supply: 100, allocated: 10 }],
      } as unknown as Event,
    },
  ];

  const allocs: Contract<TierAllocation>[] = [
    allocOf("SHOW-001", show1Time, "GA", "50.0000000000", 15000, 1000, 5000, 1, 5),
    allocOf("SHOW-001", show1Time, "GA", "55.0000000000", 15000, 1000, 5000, 6, 5),
    allocOf("SHOW-001", show1Time, "VIP", "150.0000000000", 12000, 1000, 5000, 1, 5),
    allocOf("SHOW-002", show2Time, "GA", "25.0000000000", 15000, 1000, 0, 1, 10),
  ];

  // TIX raise: 1,000 target at 1.10x factor, split 600/400 between the two
  // lenders' commitments — same numbers as Kyd.Demo:setup.
  const loans: Contract<SyndicatedLoan>[] = [
    {
      contractId: nextId("SyndicatedLoan"),
      payload: {
        operator: P.operator,
        venue: P.venue,
        eventId: "SHOW-001",
        revenueShareBps: 5000,
        dueDate: new Date(Date.UTC(2026, 7, 1)).toISOString(),
        lateInterestBpsPerDay: 10,
        lastAccrual: new Date(now).toISOString(),
        tranches: [
          { lender: P.lender, outstanding: "660.0000000000" },
          { lender: P.lender2, outstanding: "440.0000000000" },
        ],
      } as unknown as SyndicatedLoan,
    },
  ];

  const cash: Contract<Cash>[] = [
    cashOf(P.alice, 500),
    cashOf(P.bob, 500),
  ];

  return { events, allocs, tickets: [], orders: [], resaleOffers: [], giftOffers: [], cash, loans, receipts: [] };
}

function allocOf(
  eventId: string,
  eventTime: string,
  tierId: string,
  price: string,
  resaleCapBps: number,
  royaltyBps: number,
  financingShareBps: number,
  serialBase: number,
  size: number,
): Contract<TierAllocation> {
  return {
    contractId: nextId("TierAllocation"),
    payload: {
      operator: P.operator,
      venue: P.venue,
      artist: P.artist,
      eventId,
      eventTime,
      tierId,
      price,
      resaleCapBps,
      royaltyBps,
      financingShareBps,
      serialBase,
      size,
      sold: 0,
    } as unknown as TierAllocation,
  };
}

function cashOf(owner: string, amount: number): Contract<Cash> {
  return {
    contractId: nextId("Cash"),
    payload: {
      operator: P.operator,
      owner,
      amount: amount.toFixed(10),
      lock: null,
      lockRecipient: null,
      lockCoSigner: null,
      observers: [],
    } as unknown as Cash,
  };
}

const store: Store = buildSeed();

function pushCash(owner: string, amount: number): void {
  store.cash.push(cashOf(owner, amount));
}

// ---------------------------------------------------------------------------
// Notifications — the demo counterpart of the server's /notifications
// endpoints (consumed via src/notifications.ts). A plain per-party array plus
// subscribe listeners; the choice handlers and fill loop below push into it
// on exactly the actions that generate real notifications server-side: an
// offer or gift addressed to a party, and a purchase fill delivering a
// ticket.

interface StoredNotification extends AppNotification {
  party: string;
}

let notifSeq = 0;
const notifStore: StoredNotification[] = [];
const notifListeners = new Set<() => void>();

function emitNotifChange(): void {
  for (const listener of [...notifListeners]) listener();
}

function notify(party: string, kind: string, title: string, body: string, contractId: string | null): void {
  notifSeq += 1;
  notifStore.push({ id: notifSeq, party, kind, title, body, contractId, createdAt: Date.now(), readAt: null });
  emitNotifChange();
}

export function listNotifications(party: string): AppNotification[] {
  return notifStore
    .filter((n) => n.party === party)
    .map(({ id, kind, title, body, contractId, createdAt, readAt }) => ({ id, kind, title, body, contractId, createdAt, readAt }));
}

export function markNotificationsRead(ids: number[]): number {
  const at = Date.now();
  let updated = 0;
  for (const n of notifStore) {
    if (n.readAt === null && ids.includes(n.id)) {
      n.readAt = at;
      updated += 1;
    }
  }
  if (updated > 0) emitNotifChange();
  return updated;
}

export function subscribeNotifications(listener: () => void): () => void {
  notifListeners.add(listener);
  return () => {
    notifListeners.delete(listener);
  };
}

function eventNameOf(eventId: string): string {
  const ev = store.events.find((e) => (e.payload as unknown as { eventId: string }).eventId === eventId);
  return ev ? (ev.payload as unknown as { name: string }).name : eventId;
}

function firstName(party: string): string {
  return party.split("::")[0].replace(/-/g, " ");
}

// ---------------------------------------------------------------------------
// The operator's automation, simulated: fill matching purchase orders, then
// batch-sweep escrowed revenue share into the loan — mirrors
// Kyd.Triggers.autoFillOrders and sweepRevenue.

function mintTicket(alloc: Contract<TierAllocation>, fan: string): void {
  const a = alloc.payload as unknown as {
    operator: string; venue: string; artist: string; eventId: string; eventTime: string;
    tierId: string; price: string; resaleCapBps: number; royaltyBps: number; serialBase: number; size: number; sold: number;
  };
  const serial = a.serialBase + a.sold;
  const ticketCid = nextId("Ticket");
  store.tickets.push({
    contractId: ticketCid,
    payload: {
      operator: a.operator,
      venue: a.venue,
      artist: a.artist,
      owner: fan,
      eventId: a.eventId,
      eventTime: a.eventTime,
      tierId: a.tierId,
      serial,
      facePrice: a.price,
      maxResalePrice: ((Number(a.price) * a.resaleCapBps) / 10000).toFixed(10),
      royaltyBps: a.royaltyBps,
      redeemed: false,
    } as unknown as Ticket,
  });
  notify(
    fan,
    "ticket_delivered",
    "Your ticket is ready",
    `${eventNameOf(a.eventId)} — ${a.tierId} #${serial} just landed in My Tickets.`,
    ticketCid,
  );
  const newSold = a.sold + 1;
  if (newSold >= a.size) {
    store.allocs = store.allocs.filter((x) => x.contractId !== alloc.contractId);
  } else {
    alloc.payload = { ...alloc.payload, sold: newSold } as unknown as TierAllocation;
  }
}

function fillOrders(): void {
  for (const order of [...store.orders]) {
    const note = store.cash.find((c) => c.contractId === order.payload.cashCid);
    if (!note) continue;
    const committed = Number(note.payload.amount);
    const alloc = store.allocs.find(
      (a) =>
        a.payload.operator === order.payload.operator &&
        a.payload.venue === order.payload.venue &&
        a.payload.eventId === order.payload.eventId &&
        a.payload.tierId === order.payload.tierId &&
        Number(a.payload.price) === committed &&
        Number((a.payload as unknown as { sold: number }).sold) < Number((a.payload as unknown as { size: number }).size),
    );
    if (!alloc) continue;

    // The fan's committed note moves to the venue (Cash_Transfer) — no view
    // in this app displays a venue balance, so it's archived rather than
    // re-created under a new owner.
    store.cash = store.cash.filter((c) => c.contractId !== note.contractId);

    const financingShareBps = Number((alloc.payload as unknown as { financingShareBps: number }).financingShareBps);
    const share = (committed * financingShareBps) / 10000;
    if (share > 0) {
      store.receipts.push({
        contractId: nextId("RevenueShare"),
        payload: {
          operator: P.operator,
          venue: P.venue,
          eventId: alloc.payload.eventId,
          amount: share.toFixed(10),
          locked: "mock:lock",
        } as unknown as RevenueShare,
      });
    }
    mintTicket(alloc, order.payload.fan);
    store.orders = store.orders.filter((o) => o.contractId !== order.contractId);
  }
}

// Mirrors Kyd.Tix's `allocate`: telescoping pro-rata split, remainder
// absorbed by the last tranche so the amounts always sum exactly.
function allocatePayment(
  payRemaining: number,
  tranches: { lender: string; outstanding: number }[],
): [{ lender: string; outstanding: number }, number][] {
  if (tranches.length === 0) return [];
  if (tranches.length === 1) return [[tranches[0], payRemaining]];
  const [t, ...rest] = tranches;
  const remOut = t.outstanding + rest.reduce((s, x) => s + x.outstanding, 0);
  const p = remOut > 0 ? (payRemaining * t.outstanding) / remOut : 0;
  return [[t, p], ...allocatePayment(payRemaining - p, rest)];
}

// Mirrors Kyd.Triggers.sweepRevenue + Loan_SweepRevenue: for each loan, only
// the receipts scoped to that loan's (operator, venue, eventId) are eligible
// to be swept, and once a loan's tranches are all paid down to zero it is
// archived (removed from the register) rather than left around as a
// zeroed-out sink that silently absorbs future receipts.
function sweep(): void {
  for (const loan of [...store.loans]) {
    const l = loan.payload as unknown as { operator: string; venue: string; eventId: string; tranches: { lender: string; outstanding: string }[] };
    const pending = store.receipts.filter(
      (r) =>
        r.payload.operator === l.operator &&
        r.payload.venue === l.venue &&
        r.payload.eventId === l.eventId,
    );
    if (pending.length === 0) continue;
    const totalShare = pending.reduce((s, r) => s + Number(r.payload.amount), 0);
    const sweptIds = new Set(pending.map((r) => r.contractId));
    store.receipts = store.receipts.filter((r) => !sweptIds.has(r.contractId));

    const paid = allocatePayment(
      totalShare,
      l.tranches.map((t) => ({ lender: t.lender, outstanding: Number(t.outstanding) })),
    );
    const newTranches = paid.map(([t, p]) => ({ lender: t.lender, outstanding: Math.max(0, t.outstanding - p).toFixed(10) }));
    const remaining = newTranches.filter((t) => Number(t.outstanding) > 0);
    if (remaining.length === 0) {
      // All tranches fully paid down — archive the loan, same as the real
      // Loan_SweepRevenue returning None when `remaining` tranches is empty.
      store.loans = store.loans.filter((x) => x.contractId !== loan.contractId);
    } else {
      loan.payload = { ...loan.payload, tranches: newTranches } as unknown as SyndicatedLoan;
    }
  }
}

let running = false;
function ensureRunning(): void {
  if (running) return;
  running = true;
  setInterval(fillOrders, 1200);
  setInterval(sweep, 1700);
}

// ---------------------------------------------------------------------------
// MockLedger — implements exactly the three @daml/ledger methods the app
// uses (query/create/exercise), dispatched by template/choice identity. Cast
// to `Ledger` at the useSession boundary; api.ts's exactNote and placeOrder
// (written against the real `Ledger` type) run unmodified against it.

class MockLedger {
  async query<T extends object>(template: unknown): Promise<Contract<T>[]> {
    const arr = arrayFor(template);
    return arr.map((c) => ({ ...c })) as unknown as Contract<T>[];
  }

  async create<T extends object>(template: unknown, payload: T): Promise<Contract<T>> {
    if (template === PurchaseOrder) {
      const contract = { contractId: nextId("PurchaseOrder"), payload: payload as unknown as PurchaseOrder };
      store.orders.push(contract);
      return contract as unknown as Contract<T>;
    }
    throw new Error("mock ledger: unsupported create");
  }

  async exercise(choice: { choiceName: string }, contractId: unknown, args: Record<string, unknown>): Promise<[unknown, unknown[]]> {
    const cid = contractId as string;
    switch (choice.choiceName) {
      case "Cash_Split": {
        const idx = store.cash.findIndex((c) => c.contractId === cid);
        if (idx === -1) throw new Error("note not found");
        const note = store.cash[idx];
        const amount = Number(note.payload.amount);
        const splitAmount = Number(args.splitAmount);
        const keptCid = nextId("Cash");
        const sliceCid = nextId("Cash");
        store.cash[idx] = { contractId: keptCid, payload: { ...note.payload, amount: (amount - splitAmount).toFixed(10) } as unknown as Cash };
        store.cash.push({ contractId: sliceCid, payload: { ...note.payload, amount: splitAmount.toFixed(10) } as unknown as Cash });
        return [{ _1: keptCid, _2: sliceCid }, []];
      }
      case "Cash_Merge": {
        const idx = store.cash.findIndex((c) => c.contractId === cid);
        const otherIdx = store.cash.findIndex((c) => c.contractId === args.otherCid);
        if (idx === -1 || otherIdx === -1) throw new Error("note not found");
        const merged = Number(store.cash[idx].payload.amount) + Number(store.cash[otherIdx].payload.amount);
        const base = store.cash[idx].payload;
        const mergedCid = nextId("Cash");
        store.cash = store.cash.filter((_, i) => i !== idx && i !== otherIdx);
        store.cash.push({ contractId: mergedCid, payload: { ...base, amount: merged.toFixed(10) } as unknown as Cash });
        return [mergedCid, []];
      }
      case "Ticket_CheckIn": {
        const idx = store.tickets.findIndex((t) => t.contractId === cid);
        if (idx === -1) throw new Error("ticket not found");
        const t = store.tickets[idx].payload as unknown as { eventTime: string; redeemed: boolean };
        if (t.redeemed) throw new Error("ticket already redeemed");
        const hoursUntil = (new Date(t.eventTime).getTime() - Date.now()) / 3600000;
        if (hoursUntil > 12) throw new Error("too early to check in");
        const newCid = nextId("Ticket");
        store.tickets[idx] = { contractId: newCid, payload: { ...store.tickets[idx].payload, redeemed: true } as unknown as Ticket };
        return [newCid, []];
      }
      case "Ticket_Offer": {
        const idx = store.tickets.findIndex((t) => t.contractId === cid);
        if (idx === -1) throw new Error("ticket not found");
        const t = store.tickets[idx].payload as unknown as {
          redeemed: boolean; owner: string; maxResalePrice: string; eventId: string; tierId: string; serial: number;
        };
        if (t.redeemed) throw new Error("redeemed tickets cannot be resold");
        const salePrice = Number(args.salePrice);
        if (salePrice > Number(t.maxResalePrice)) throw new Error("resale price exceeds the anti-scalping cap");
        if (args.buyer === t.owner) throw new Error("buyer must differ from the current owner");
        store.tickets.splice(idx, 1);
        const offerCid = nextId("ResaleOffer");
        store.resaleOffers.push({
          contractId: offerCid,
          payload: { ticket: t, buyer: args.buyer, salePrice: salePrice.toFixed(10) } as unknown as ResaleOffer,
        });
        notify(
          args.buyer as string,
          "resale_offer",
          "Ticket offered to you",
          `${firstName(t.owner)} wants to sell you ${eventNameOf(t.eventId)} — ${t.tierId} #${t.serial} for $${salePrice.toFixed(2)}.`,
          offerCid,
        );
        return [offerCid, []];
      }
      case "Ticket_OfferGift": {
        const idx = store.tickets.findIndex((t) => t.contractId === cid);
        if (idx === -1) throw new Error("ticket not found");
        const t = store.tickets[idx].payload as unknown as {
          redeemed: boolean; owner: string; eventId: string; tierId: string; serial: number;
        };
        if (t.redeemed) throw new Error("redeemed tickets cannot be gifted");
        if (args.recipient === t.owner) throw new Error("recipient must differ from the current owner");
        store.tickets.splice(idx, 1);
        const giftCid = nextId("GiftOffer");
        store.giftOffers.push({ contractId: giftCid, payload: { ticket: t, recipient: args.recipient } as unknown as GiftOffer });
        notify(
          args.recipient as string,
          "gift_offer",
          "You've been sent a ticket",
          `${firstName(t.owner)} sent you ${eventNameOf(t.eventId)} — ${t.tierId} #${t.serial}, free.`,
          giftCid,
        );
        return [giftCid, []];
      }
      case "ResaleOffer_Accept": {
        const idx = store.resaleOffers.findIndex((o) => o.contractId === cid);
        if (idx === -1) throw new Error("offer not found");
        const offer = store.resaleOffers[idx].payload as unknown as {
          ticket: { royaltyBps: number; artist: string; owner: string; eventId: string; tierId: string; serial: number };
          salePrice: string;
          buyer: string;
        };
        const cashIdx = store.cash.findIndex((c) => c.contractId === args.cashCid);
        if (cashIdx === -1) throw new Error("payment note not found");
        const note = store.cash[cashIdx];
        if (Number(note.payload.amount) !== Number(offer.salePrice)) {
          throw new Error("payment must equal the agreed sale price");
        }
        store.resaleOffers.splice(idx, 1);
        store.cash.splice(cashIdx, 1);
        const salePrice = Number(offer.salePrice);
        const royalty = (salePrice * offer.ticket.royaltyBps) / 10000;
        if (royalty > 0) {
          pushCash(offer.ticket.artist, royalty);
          pushCash(offer.ticket.owner, salePrice - royalty);
        } else {
          pushCash(offer.ticket.owner, salePrice);
        }
        const newTicketCid = nextId("Ticket");
        store.tickets.push({ contractId: newTicketCid, payload: { ...offer.ticket, owner: offer.buyer } as unknown as Ticket });
        notify(
          offer.ticket.owner,
          "resale_settled",
          "Your ticket sold",
          `${eventNameOf(offer.ticket.eventId)} — ${offer.ticket.tierId} #${offer.ticket.serial} sold for $${salePrice.toFixed(2)}; proceeds are in your balance.`,
          newTicketCid,
        );
        return [newTicketCid, []];
      }
      case "ResaleOffer_Reject":
      case "ResaleOffer_Withdraw": {
        const idx = store.resaleOffers.findIndex((o) => o.contractId === cid);
        if (idx === -1) throw new Error("offer not found");
        const offer = store.resaleOffers[idx].payload;
        store.resaleOffers.splice(idx, 1);
        const newTicketCid = nextId("Ticket");
        store.tickets.push({ contractId: newTicketCid, payload: offer.ticket as unknown as Ticket });
        return [newTicketCid, []];
      }
      case "GiftOffer_Accept": {
        const idx = store.giftOffers.findIndex((g) => g.contractId === cid);
        if (idx === -1) throw new Error("gift not found");
        const gift = store.giftOffers[idx].payload;
        store.giftOffers.splice(idx, 1);
        const newTicketCid = nextId("Ticket");
        store.tickets.push({ contractId: newTicketCid, payload: { ...gift.ticket, owner: gift.recipient } as unknown as Ticket });
        return [newTicketCid, []];
      }
      case "GiftOffer_Decline":
      case "GiftOffer_Withdraw": {
        const idx = store.giftOffers.findIndex((g) => g.contractId === cid);
        if (idx === -1) throw new Error("gift not found");
        const gift = store.giftOffers[idx].payload;
        store.giftOffers.splice(idx, 1);
        const newTicketCid = nextId("Ticket");
        store.tickets.push({ contractId: newTicketCid, payload: gift.ticket as unknown as Ticket });
        return [newTicketCid, []];
      }
      case "PurchaseOrder_Cancel": {
        store.orders = store.orders.filter((o) => o.contractId !== cid);
        return [undefined, []];
      }
      case "Event_OpenAllocation": {
        const idx = store.events.findIndex((e) => e.contractId === cid);
        if (idx === -1) throw new Error("event not found");
        const ev = store.events[idx].payload as unknown as {
          operator: string; venue: string; artist: string; eventId: string; royaltyBps: number; financingShareBps: number;
          tiers: { tierId: string; basePrice: string; demandBps: number; resaleCapBps: number; supply: number; allocated: number }[];
        };
        const tier = ev.tiers.find((t) => t.tierId === args.tierId);
        if (!tier) throw new Error(`unknown tier: ${args.tierId}`);
        const size = Number(args.size);
        if (size <= 0) throw new Error("size must be positive");
        if (tier.allocated + size > tier.supply) throw new Error("allocation exceeds the tier's remaining supply");
        const price = Number(tier.basePrice) * (1 + (tier.allocated * tier.demandBps) / 10000);
        const eventTime = (store.events[idx].payload as unknown as { eventTime: string }).eventTime;
        const newAlloc = allocOf(ev.eventId, eventTime, tier.tierId, price.toFixed(10), tier.resaleCapBps, ev.royaltyBps, ev.financingShareBps, tier.allocated + 1, size);
        store.allocs.push(newAlloc);
        const allocCid = newAlloc.contractId;
        const newEventCid = nextId("Event");
        store.events[idx] = {
          contractId: newEventCid,
          payload: {
            ...ev,
            tiers: ev.tiers.map((t) => (t.tierId === args.tierId ? { ...t, allocated: t.allocated + size } : t)),
          } as unknown as Event,
        };
        return [{ _1: newEventCid, _2: allocCid }, []];
      }
      default:
        throw new Error(`mock ledger: unsupported choice ${choice.choiceName}`);
    }
  }
}

function arrayFor(template: unknown): Contract<object>[] {
  if (template === Cash) return store.cash as unknown as Contract<object>[];
  if (template === Event) return store.events as unknown as Contract<object>[];
  if (template === TierAllocation) return store.allocs as unknown as Contract<object>[];
  if (template === PurchaseOrder) return store.orders as unknown as Contract<object>[];
  if (template === Ticket) return store.tickets as unknown as Contract<object>[];
  if (template === ResaleOffer) return store.resaleOffers as unknown as Contract<object>[];
  if (template === GiftOffer) return store.giftOffers as unknown as Contract<object>[];
  if (template === SyndicatedLoan) return store.loans as unknown as Contract<object>[];
  if (template === RevenueShare) return store.receipts as unknown as Contract<object>[];
  return [];
}

// Exported as a plain value (not a hook) so api.ts's useSession/useCatalog
// can call React hooks (useQuery, etc.) directly and unconditionally
// themselves, using this as a plain data dependency — a hook whose identity
// only becomes available after this module's dynamic import resolves can't
// safely be called conditionally from inside another hook (see
// useDemoModule in api.ts).
export const mockLedger = new MockLedger() as unknown as Ledger;
export { partyForRole };

// ---------------------------------------------------------------------------
// The api.ts-shaped surface: everything that talks to the network directly
// in the real implementation.

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadDemoParties(): Promise<DemoParties> {
  ensureRunning();
  await delay(250);
  return P;
}

export async function topUp(fanToken: string, amount: number): Promise<void> {
  await delay(150);
  pushCash(fanToken, amount);
}
