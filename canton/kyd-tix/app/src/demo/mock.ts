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
// unmodified against it. Only the functions that talk to the network
// directly (useSession, loadDemoParties, useCatalog, topUp) have a demo
// counterpart here, wired in by api.ts's DEMO_MODE branch.
import { useEffect, useState } from "react";
import type Ledger from "@daml/ledger";
import { Cash } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Cash";
import { Event, PurchaseOrder, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { GiftOffer, ResaleOffer, Ticket } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { SyndicatedLoan } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Tix";
import { RevenueShare } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Settlement";
import { useQuery } from "../ledgerQuery";
import type { CatalogResult, DemoParties, RoleKey, Session } from "../api";

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
// The operator's automation, simulated: fill matching purchase orders, then
// batch-sweep escrowed revenue share into the loan — mirrors
// Kyd.Triggers.autoFillOrders and sweepRevenue.

function mintTicket(alloc: Contract<TierAllocation>, fan: string): void {
  const a = alloc.payload as unknown as {
    operator: string; venue: string; artist: string; eventId: string; eventTime: string;
    tierId: string; price: string; resaleCapBps: number; royaltyBps: number; serialBase: number; size: number; sold: number;
  };
  const serial = a.serialBase + a.sold;
  store.tickets.push({
    contractId: nextId("Ticket"),
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

function sweep(): void {
  if (store.receipts.length === 0) return;
  const totalShare = store.receipts.reduce((s, r) => s + Number(r.payload.amount), 0);
  store.receipts = [];
  const loan = store.loans.find((l) => l.payload.eventId === "SHOW-001");
  if (!loan) return;
  const tranches = (loan.payload as unknown as { tranches: { lender: string; outstanding: string }[] }).tranches;
  const paid = allocatePayment(
    totalShare,
    tranches.map((t) => ({ lender: t.lender, outstanding: Number(t.outstanding) })),
  );
  const newTranches = paid.map(([t, p]) => ({ lender: t.lender, outstanding: Math.max(0, t.outstanding - p).toFixed(10) }));
  loan.payload = { ...loan.payload, tranches: newTranches } as unknown as SyndicatedLoan;
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
        const t = store.tickets[idx].payload;
        store.tickets.splice(idx, 1);
        const offerCid = nextId("ResaleOffer");
        store.resaleOffers.push({
          contractId: offerCid,
          payload: { ticket: t, buyer: args.buyer, salePrice: Number(args.salePrice).toFixed(10) } as unknown as ResaleOffer,
        });
        return [offerCid, []];
      }
      case "Ticket_OfferGift": {
        const idx = store.tickets.findIndex((t) => t.contractId === cid);
        if (idx === -1) throw new Error("ticket not found");
        const t = store.tickets[idx].payload;
        store.tickets.splice(idx, 1);
        const giftCid = nextId("GiftOffer");
        store.giftOffers.push({ contractId: giftCid, payload: { ticket: t, recipient: args.recipient } as unknown as GiftOffer });
        return [giftCid, []];
      }
      case "ResaleOffer_Accept": {
        const idx = store.resaleOffers.findIndex((o) => o.contractId === cid);
        if (idx === -1) throw new Error("offer not found");
        const offer = store.resaleOffers[idx].payload as unknown as {
          ticket: { royaltyBps: number; artist: string; owner: string };
          salePrice: string;
          buyer: string;
        };
        store.resaleOffers.splice(idx, 1);
        const cashIdx = store.cash.findIndex((c) => c.contractId === args.cashCid);
        if (cashIdx !== -1) store.cash.splice(cashIdx, 1);
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

const mockLedger = new MockLedger() as unknown as Ledger;

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

export function useSession(partyKey: RoleKey | null): { session: Session | null; ledger: Ledger | null } {
  const [party, setParty] = useState<string | null>(null);
  useEffect(() => {
    setParty(partyKey ? partyForRole(partyKey) : null);
  }, [partyKey]);
  // token === party: nothing here verifies a signature, so there is no
  // separate credential to mint — see topUp below, which relies on this.
  const session = party ? { token: party, party } : null;
  return { session, ledger: session ? mockLedger : null };
}

export function useCatalog(): CatalogResult {
  const events = useQuery(mockLedger, Event);
  const allocs = useQuery(mockLedger, TierAllocation);
  return { events, allocs };
}

export async function topUp(fanToken: string, amount: number): Promise<void> {
  await delay(150);
  pushCash(fanToken, amount);
}
