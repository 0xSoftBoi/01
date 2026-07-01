import { describe, expect, it } from "vitest";
import type { Template } from "@daml/types";
import { Event } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { GiftOffer, Ticket } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { Indexer } from "../src/indexer.js";
import { openDb } from "../src/db.js";
import type { LedgerContract, QueryableLedger } from "../src/ledgerSession.js";

const BOB = "Bob::bo1";

// Mutable ACS-by-templateId: tests mutate `state` between runOnce calls to
// simulate contracts appearing and disappearing on the ledger.
function stubLedger(state: Record<string, LedgerContract[]>): QueryableLedger {
  return {
    async query<T extends object, K, I extends string>(template: Template<T, K, I>) {
      return (state[template.templateId] ?? []) as LedgerContract<T>[];
    },
  };
}

const eventPayload = {
  operator: "Op::1",
  venue: "Venue::v1",
  artist: "Artist::a1",
  eventId: "SHOW-001",
  name: "Neon Nights",
  eventTime: "2026-08-01T20:00:00Z",
  royaltyBps: "500",
  financingShareBps: "1000",
  tiers: [],
};

const ticketPayload = {
  operator: "Op::1",
  venue: "Venue::v1",
  artist: "Artist::a1",
  owner: "Alice::al1",
  eventId: "SHOW-001",
  eventTime: "2026-08-01T20:00:00Z",
  tierId: "GA",
  serial: "7",
  facePrice: "50.0",
  maxResalePrice: "60.0",
  royaltyBps: "500",
  redeemed: false,
};

describe("Indexer", () => {
  it("baseline run records the existing world silently, emitting zero notifications", async () => {
    const db = openDb(":memory:");
    const state: Record<string, LedgerContract[]> = {
      [Event.templateId]: [{ contractId: "#ev:0", payload: eventPayload }],
      [GiftOffer.templateId]: [
        { contractId: "#go:0", payload: { ticket: ticketPayload, recipient: BOB } },
      ],
    };
    const indexer = new Indexer(stubLedger(state), db);
    await indexer.runOnce();

    // Pre-existing offer indexed but NOT announced — it predates us.
    expect(db.getActiveContracts(GiftOffer.templateId)).toHaveLength(1);
    expect(db.listNotifications(BOB, 50)).toEqual([]);
    expect(db.getIndexerState("last_run_at")).not.toBeNull();
  });

  it("a post-baseline offer notifies exactly the targeted party, with the event name resolved", async () => {
    const db = openDb(":memory:");
    const state: Record<string, LedgerContract[]> = {
      [Event.templateId]: [{ contractId: "#ev:0", payload: eventPayload }],
    };
    const indexer = new Indexer(stubLedger(state), db);
    await indexer.runOnce();

    state[GiftOffer.templateId] = [{ contractId: "#go:0", payload: { ticket: ticketPayload, recipient: BOB } }];
    await indexer.runOnce();

    const bobs = db.listNotifications(BOB, 50);
    expect(bobs).toHaveLength(1);
    expect(bobs[0].kind).toBe("offer_received");
    expect(bobs[0].title).toBe("You've been offered a ticket to Neon Nights");
    expect(bobs[0].contractId).toBe("#go:0");
    // The ticket's current owner is a signatory of the offer, not its
    // audience — no notification for anyone else.
    expect(db.listNotifications(ticketPayload.owner, 50)).toEqual([]);

    // Seeing the same contract again is not a new transition.
    await indexer.runOnce();
    expect(db.listNotifications(BOB, 50)).toHaveLength(1);
  });

  it("a post-baseline ticket notifies its owner it was delivered", async () => {
    const db = openDb(":memory:");
    const state: Record<string, LedgerContract[]> = {
      [Event.templateId]: [{ contractId: "#ev:0", payload: eventPayload }],
    };
    const indexer = new Indexer(stubLedger(state), db);
    await indexer.runOnce();

    state[Ticket.templateId] = [{ contractId: "#tk:0", payload: { ...ticketPayload, owner: BOB } }];
    await indexer.runOnce();

    const bobs = db.listNotifications(BOB, 50);
    expect(bobs).toHaveLength(1);
    expect(bobs[0].kind).toBe("ticket_delivered");
    expect(bobs[0].title).toBe("Your ticket to Neon Nights");
  });

  it("a contract disappearing from the ACS is marked archived", async () => {
    const db = openDb(":memory:");
    const state: Record<string, LedgerContract[]> = {
      [Event.templateId]: [{ contractId: "#ev:0", payload: eventPayload }],
      [GiftOffer.templateId]: [
        { contractId: "#go:0", payload: { ticket: ticketPayload, recipient: BOB } },
      ],
    };
    const indexer = new Indexer(stubLedger(state), db);
    await indexer.runOnce();

    delete state[GiftOffer.templateId];
    await indexer.runOnce();

    expect(db.getActiveContracts(GiftOffer.templateId)).toEqual([]);
    // The offer's target hears it closed — the one archival the payload lets
    // us attribute confidently.
    const bobs = db.listNotifications(BOB, 50);
    expect(bobs).toHaveLength(1);
    expect(bobs[0].kind).toBe("offer_closed");
  });

  it("a ledger failure records last_error without throwing out of the run loop", async () => {
    const db = openDb(":memory:");
    const failing: QueryableLedger = {
      query: async () => {
        throw new Error("ledger unreachable");
      },
    };
    const indexer = new Indexer(failing, db);
    await expect(indexer.runOnce()).resolves.toBeUndefined();
    expect(db.getIndexerState("last_error")).toBe("ledger unreachable");
    // A failed run must not claim the baseline was captured.
    expect(db.getIndexerState("baseline_done")).toBeNull();
  });
});
