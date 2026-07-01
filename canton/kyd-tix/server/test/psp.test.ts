import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { signPspEvent, verifyPspSignature } from "../src/psp.js";
import { webhookRouter } from "../src/webhook.js";
import { paymentsRouter } from "../src/payments.js";
import { issueLedgerToken } from "../src/tokens.js";
import type { MintableLedger } from "../src/ledgerSession.js";

const OPERATOR = "KYD-Operator::op1";
const ALICE = "Alice::al1";

function fakeLedger(): MintableLedger & { create: ReturnType<typeof vi.fn> } {
  return { create: vi.fn().mockResolvedValue({ contractId: "#fake:0" }) };
}

describe("verifyPspSignature", () => {
  it("accepts a correctly signed body and rejects a tampered one", () => {
    const body = JSON.stringify({ type: "charge.succeeded", data: { fanParty: ALICE, amount: 25 } });
    const sig = signPspEvent(body);
    expect(verifyPspSignature(Buffer.from(body), sig)).toBe(true);
    expect(verifyPspSignature(Buffer.from(body + "x"), sig)).toBe(false);
    expect(verifyPspSignature(Buffer.from(body), "sha256=deadbeef")).toBe(false);
    expect(verifyPspSignature(Buffer.from(body), undefined)).toBe(false);
  });
});

describe("POST /webhooks/psp", () => {
  const app = (ledger: MintableLedger) => {
    const a = express();
    a.use(webhookRouter(ledger, OPERATOR));
    return a;
  };

  it("mints on a validly signed charge.succeeded event", async () => {
    const ledger = fakeLedger();
    const body = JSON.stringify({ type: "charge.succeeded", data: { fanParty: ALICE, amount: 25 } });
    const res = await request(app(ledger))
      .post("/webhooks/psp")
      .set("content-type", "application/json")
      .set("x-webhook-signature", signPspEvent(body))
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ minted: true });
    expect(ledger.create).toHaveBeenCalledTimes(1);
    expect(ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: "#kyd-tix:Kyd.Cash:Cash" }),
      expect.objectContaining({ operator: OPERATOR, owner: ALICE, amount: "25.0000000000" }),
    );
  });

  it("rejects a request with an invalid signature and mints nothing", async () => {
    const ledger = fakeLedger();
    const body = JSON.stringify({ type: "charge.succeeded", data: { fanParty: ALICE, amount: 25 } });
    const res = await request(app(ledger))
      .post("/webhooks/psp")
      .set("content-type", "application/json")
      .set("x-webhook-signature", "sha256=" + "0".repeat(64))
      .send(body);
    expect(res.status).toBe(401);
    expect(ledger.create).not.toHaveBeenCalled();
  });

  it("rejects a request with no signature header", async () => {
    const ledger = fakeLedger();
    const res = await request(app(ledger))
      .post("/webhooks/psp")
      .set("content-type", "application/json")
      .send(JSON.stringify({ type: "charge.succeeded", data: { fanParty: ALICE, amount: 25 } }));
    expect(res.status).toBe(401);
    expect(ledger.create).not.toHaveBeenCalled();
  });

  it("ignores event types it doesn't recognize without minting", async () => {
    const ledger = fakeLedger();
    const body = JSON.stringify({ type: "charge.refunded", data: { fanParty: ALICE, amount: 25 } });
    const res = await request(app(ledger))
      .post("/webhooks/psp")
      .set("content-type", "application/json")
      .set("x-webhook-signature", signPspEvent(body))
      .send(body);
    expect(res.status).toBe(202);
    expect(ledger.create).not.toHaveBeenCalled();
  });
});

describe("POST /payments/topup", () => {
  const app = (ledger: MintableLedger) => {
    const a = express();
    a.use(express.json());
    a.use(paymentsRouter(ledger, OPERATOR));
    return a;
  };

  it("mints for the party named in the caller's own bearer token", async () => {
    const ledger = fakeLedger();
    const token = await issueLedgerToken(ALICE, { actAs: [ALICE], expiresInSeconds: 300 });
    const res = await request(app(ledger))
      .post("/payments/topup")
      .set("authorization", `Bearer ${token}`)
      .send({ amount: 40 });
    expect(res.status).toBe(200);
    expect(ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: "#kyd-tix:Kyd.Cash:Cash" }),
      expect.objectContaining({ owner: ALICE, amount: "40.0000000000" }),
    );
  });

  it("rejects a request with no session token", async () => {
    const ledger = fakeLedger();
    const res = await request(app(ledger)).post("/payments/topup").send({ amount: 40 });
    expect(res.status).toBe(401);
    expect(ledger.create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive amount", async () => {
    const ledger = fakeLedger();
    const token = await issueLedgerToken(ALICE, { actAs: [ALICE], expiresInSeconds: 300 });
    const res = await request(app(ledger))
      .post("/payments/topup")
      .set("authorization", `Bearer ${token}`)
      .send({ amount: -5 });
    expect(res.status).toBe(400);
    expect(ledger.create).not.toHaveBeenCalled();
  });
});
