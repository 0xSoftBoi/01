import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { signPspEvent } from "../src/psp.js";
import { webhookRouter } from "../src/webhook.js";
import { paymentsRouter } from "../src/payments.js";
import { openDb, type KydDb } from "../src/db.js";
import { issueLedgerToken } from "../src/tokens.js";
import type { MintableLedger } from "../src/ledgerSession.js";

const OPERATOR = "KYD-Operator::op1";
const ALICE = "Alice::al1";

function fakeLedger(): MintableLedger & { create: ReturnType<typeof vi.fn> } {
  return { create: vi.fn().mockResolvedValue({ contractId: "#fake:0" }) };
}

function webhookApp(ledger: MintableLedger, db: KydDb) {
  const a = express();
  a.use(webhookRouter(ledger, OPERATOR, db));
  return a;
}

async function post(app: express.Express, body: string) {
  return request(app)
    .post("/webhooks/psp")
    .set("content-type", "application/json")
    .set("x-webhook-signature", signPspEvent(body))
    .send(body);
}

describe("POST /webhooks/psp idempotency", () => {
  it("a replayed delivery with the PSP's event id mints once and reports duplicate after", async () => {
    const ledger = fakeLedger();
    const app = webhookApp(ledger, openDb(":memory:"));
    const body = JSON.stringify({
      id: "evt_001",
      type: "charge.succeeded",
      data: { fanParty: ALICE, amount: 25 },
    });

    const first = await post(app, body);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ minted: true });

    const replay = await post(app, body);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ status: "duplicate" });
    expect(ledger.create).toHaveBeenCalledTimes(1);
  });

  it("without an event id, identical signed bytes dedupe by body hash but different charges still mint", async () => {
    const ledger = fakeLedger();
    const app = webhookApp(ledger, openDb(":memory:"));
    const body = JSON.stringify({ type: "charge.succeeded", data: { fanParty: ALICE, amount: 25 } });

    expect((await post(app, body)).body).toEqual({ minted: true });
    expect((await post(app, body)).body).toEqual({ status: "duplicate" });

    // A genuinely different charge differs somewhere in the body, so its
    // hash — and therefore its delivery id — differs.
    const other = JSON.stringify({ type: "charge.succeeded", data: { fanParty: ALICE, amount: 30 } });
    expect((await post(app, other)).body).toEqual({ minted: true });
    expect(ledger.create).toHaveBeenCalledTimes(2);
  });

  it("repeated identical top-ups keep minting: each synthesized event carries a fresh nonce id", async () => {
    const ledger = fakeLedger();
    const a = express();
    a.use(express.json());
    a.use(paymentsRouter(ledger, OPERATOR, openDb(":memory:")));
    const token = await issueLedgerToken(ALICE, { actAs: [ALICE], expiresInSeconds: 300 });

    for (let i = 0; i < 2; i++) {
      const res = await request(a)
        .post("/payments/topup")
        .set("authorization", `Bearer ${token}`)
        .send({ amount: 40 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ minted: true });
    }
    expect(ledger.create).toHaveBeenCalledTimes(2);
  });
});
