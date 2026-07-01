import { describe, expect, it, vi } from "vitest";
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

const JSON_API_URL = "http://json-api.invalid";

function app(ensureUser = vi.fn().mockResolvedValue(undefined)) {
  const a = express();
  a.use(express.json());
  a.use(authRouter(parties, JSON_API_URL, ensureUser));
  return { app: a, ensureUser };
}

describe("POST /auth/login", () => {
  it("issues a token scoped to exactly the requested seeded party, after provisioning its Daml User", async () => {
    const { app: a, ensureUser } = app();
    const res = await request(a).post("/auth/login").send({ partyKey: "alice" });
    expect(res.status).toBe(200);
    expect(res.body.party).toBe(parties.alice);

    // Real Canton participants resolve `sub` through Daml User Management —
    // see userManagement.ts — so `sub` is the provisioned user id, not the
    // raw party string, and that provisioning must have happened first.
    expect(ensureUser).toHaveBeenCalledWith(JSON_API_URL, "kyd-alice", parties.alice);
    const payload = await verifyToken(res.body.token);
    expect(payload.sub).toBe("kyd-alice");
    expect(payload["https://daml.com/ledger-api"]).toMatchObject({
      actAs: [parties.alice],
      readAs: [parties.alice],
    });
  });

  it("never issues a token for the operator, even if explicitly requested", async () => {
    const { app: a, ensureUser } = app();
    const res = await request(a).post("/auth/login").send({ partyKey: "operator" });
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
    expect(ensureUser).not.toHaveBeenCalled();
  });

  it("rejects an unknown party key", async () => {
    const { app: a } = app();
    const res = await request(a).post("/auth/login").send({ partyKey: "nonexistent" });
    expect(res.status).toBe(403);
  });

  it("rejects a missing or malformed party key", async () => {
    const { app: a } = app();
    const res = await request(a).post("/auth/login").send({});
    expect(res.status).toBe(403);
  });

  it("degrades to a 502 if provisioning the Daml User fails, rather than issuing a token anyway", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("ledger unreachable"));
    const { app: a } = app(failing);
    const res = await request(a).post("/auth/login").send({ partyKey: "alice" });
    expect(res.status).toBe(502);
    expect(res.body.token).toBeUndefined();
  });
});
