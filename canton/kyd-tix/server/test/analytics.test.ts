import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { Event } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { Ticket, GiftOffer, ResaleOffer } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { analyticsRouter } from "../src/analyticsApi.js";
import { openDb, type KydDb } from "../src/db.js";
import { issueLedgerToken } from "../src/tokens.js";

const OPERATOR = "KYD-Operator::op1";
const ALICE = "Alice::al1";

function app(db: KydDb) {
  const a = express();
  a.use(express.json());
  a.use(analyticsRouter(db, OPERATOR));
  return a;
}

function tokenFor(party: string) {
  return issueLedgerToken(party, { actAs: [party], expiresInSeconds: 300 });
}

describe("POST /analytics/events", () => {
  it("accepts an anonymous batch (the funnel starts before login)", async () => {
    const db = openDb(":memory:");
    const res = await request(app(db))
      .post("/analytics/events")
      .send({ sessionId: "s1", events: [{ name: "page_view" }, { name: "checkout.start", props: { tier: "GA" } }] });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accepted: 2 });
    expect(db.analyticsCountsByName()).toEqual({ page_view: 1, "checkout.start": 1 });
  });

  it("attaches the party when a valid bearer token is present", async () => {
    const db = openDb(":memory:");
    const res = await request(app(db))
      .post("/analytics/events")
      .set("authorization", `Bearer ${await tokenFor(ALICE)}`)
      .send({ sessionId: "s1", events: [{ name: "wallet_open" }] });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ accepted: 1 });
  });

  it("rejects a batch of more than 20 events", async () => {
    const db = openDb(":memory:");
    const res = await request(app(db))
      .post("/analytics/events")
      .send({ sessionId: "s1", events: Array.from({ length: 21 }, () => ({ name: "page_view" })) });
    expect(res.status).toBe(400);
    expect(db.analyticsCountsByName()).toEqual({});
  });

  it("rejects names outside the closed grammar and oversized sessionIds — nothing partial is stored", async () => {
    const db = openDb(":memory:");
    const badName = await request(app(db))
      .post("/analytics/events")
      .send({ sessionId: "s1", events: [{ name: "page_view" }, { name: "DROP TABLE" }] });
    expect(badName.status).toBe(400);
    const badSession = await request(app(db))
      .post("/analytics/events")
      .send({ sessionId: "x".repeat(65), events: [{ name: "page_view" }] });
    expect(badSession.status).toBe(400);
    expect(db.analyticsCountsByName()).toEqual({});
  });
});

describe("GET /analytics/summary", () => {
  it("is 401 without a token and 403 for a non-operator session", async () => {
    const db = openDb(":memory:");
    const anon = await request(app(db)).get("/analytics/summary");
    expect(anon.status).toBe(401);
    const fan = await request(app(db))
      .get("/analytics/summary")
      .set("authorization", `Bearer ${await tokenFor(ALICE)}`);
    expect(fan.status).toBe(403);
  });

  it("returns client counts plus active-contract counts from the indexed ACS for the operator", async () => {
    const db = openDb(":memory:");
    db.insertAnalyticsEvents([{ sessionId: "s1", name: "page_view" }], 1000);
    db.upsertContract("#ev:0", Event.templateId, { eventId: "SHOW-001" }, 1000);
    db.upsertContract("#tk:0", Ticket.templateId, {}, 1000);
    db.upsertContract("#tk:1", Ticket.templateId, {}, 1000);
    db.upsertContract("#go:0", GiftOffer.templateId, {}, 1000);
    db.upsertContract("#ro:0", ResaleOffer.templateId, {}, 1000);
    // Archived rows must not count as open.
    db.markArchivedExcept(ResaleOffer.templateId, [], 2000);

    const res = await request(app(db))
      .get("/analytics/summary")
      .set("authorization", `Bearer ${await tokenFor(OPERATOR)}`);
    expect(res.status).toBe(200);
    expect(res.body.clientEvents).toEqual({ page_view: 1 });
    expect(res.body.ledger).toEqual({
      events: 1,
      allocations: 0,
      ticketsActive: 2,
      offersOpen: 1,
      resalesOpen: 0,
      loansActive: 0,
    });
  });
});
