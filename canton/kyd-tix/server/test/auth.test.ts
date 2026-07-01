import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { authRouter } from "../src/identity.js";
import { verifyToken } from "../src/verify.js";
import type { DemoParties } from "../src/demoParties.js";

const parties: DemoParties = {
  operator: "KYD-Operator::op1",
  venue: "Venue::v1",
  artist: "Artist::a1",
  alice: "Alice::al1",
  bob: "Bob::bo1",
  lender: "Lender::le1",
  lender2: "Lender2::le2",
};

function app() {
  const a = express();
  a.use(express.json());
  a.use(authRouter(parties));
  return a;
}

describe("POST /auth/login", () => {
  it("issues a token scoped to exactly the requested seeded party", async () => {
    const res = await request(app()).post("/auth/login").send({ partyKey: "alice" });
    expect(res.status).toBe(200);
    expect(res.body.party).toBe(parties.alice);

    const payload = await verifyToken(res.body.token);
    expect(payload.sub).toBe(parties.alice);
    expect(payload["https://daml.com/ledger-api"]).toMatchObject({
      actAs: [parties.alice],
      readAs: [parties.alice],
    });
  });

  it("never issues a token for the operator, even if explicitly requested", async () => {
    const res = await request(app()).post("/auth/login").send({ partyKey: "operator" });
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it("rejects an unknown party key", async () => {
    const res = await request(app()).post("/auth/login").send({ partyKey: "nonexistent" });
    expect(res.status).toBe(403);
  });

  it("rejects a missing or malformed party key", async () => {
    const res = await request(app()).post("/auth/login").send({});
    expect(res.status).toBe(403);
  });
});
