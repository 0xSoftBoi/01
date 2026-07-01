import { describe, expect, it, afterAll } from "vitest";
import express from "express";
import type { Server } from "node:http";
import request from "supertest";
import { notificationsRouter } from "../src/notificationsApi.js";
import { openDb, type KydDb } from "../src/db.js";
import { issueLedgerToken } from "../src/tokens.js";

const ALICE = "Alice::al1";
const BOB = "Bob::bo1";

function app(db: KydDb) {
  const a = express();
  a.use(express.json());
  a.use(notificationsRouter(db));
  return a;
}

// Same real signed tokens the auth flow issues (see psp.test.ts) — the party
// is whatever `sub` the verified token carries.
function tokenFor(party: string) {
  return issueLedgerToken(party, { actAs: [party], expiresInSeconds: 300 });
}

describe("GET /notifications", () => {
  it("rejects a request with no session token", async () => {
    const db = openDb(":memory:");
    const res = await request(app(db)).get("/notifications");
    expect(res.status).toBe(401);
  });

  it("returns only the caller's own notifications, newest first", async () => {
    const db = openDb(":memory:");
    const a1 = db.insertNotification({ party: ALICE, kind: "offer_received", title: "old", body: "b" }, 1000);
    const a2 = db.insertNotification(
      { party: ALICE, kind: "ticket_delivered", title: "new", body: "b", contractId: "#tk:0" },
      2000,
    );
    db.insertNotification({ party: BOB, kind: "offer_received", title: "bobs", body: "b" }, 3000);

    const res = await request(app(db))
      .get("/notifications")
      .set("authorization", `Bearer ${await tokenFor(ALICE)}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([
      { id: a2, kind: "ticket_delivered", title: "new", body: "b", contractId: "#tk:0", createdAt: 2000, readAt: null },
      { id: a1, kind: "offer_received", title: "old", body: "b", contractId: null, createdAt: 1000, readAt: null },
    ]);
  });
});

describe("POST /notifications/read", () => {
  it("marks own rows and silently skips another party's ids", async () => {
    const db = openDb(":memory:");
    const mine = db.insertNotification({ party: ALICE, kind: "k", title: "t", body: "b" }, 1000);
    const theirs = db.insertNotification({ party: BOB, kind: "k", title: "t", body: "b" }, 1000);

    const res = await request(app(db))
      .post("/notifications/read")
      .set("authorization", `Bearer ${await tokenFor(ALICE)}`)
      .send({ ids: [mine, theirs] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 1 });
    expect(db.countUnreadNotifications(BOB)).toBe(1);
  });

  it("rejects a malformed or oversized ids batch", async () => {
    const db = openDb(":memory:");
    const token = await tokenFor(ALICE);
    const bad = await request(app(db))
      .post("/notifications/read")
      .set("authorization", `Bearer ${token}`)
      .send({ ids: ["1"] });
    expect(bad.status).toBe(400);
    const oversized = await request(app(db))
      .post("/notifications/read")
      .set("authorization", `Bearer ${token}`)
      .send({ ids: Array.from({ length: 101 }, (_, i) => i) });
    expect(oversized.status).toBe(400);
  });
});

describe("GET /notifications/stream", () => {
  let server: Server;

  afterAll(() => {
    server?.close();
  });

  it("rejects a missing or invalid token", async () => {
    const db = openDb(":memory:");
    const res = await request(app(db)).get("/notifications/stream");
    expect(res.status).toBe(401);
  });

  // supertest buffers responses, so the never-ending stream is read over a
  // real socket: first frame must arrive immediately, not on the first poll
  // tick 2s later.
  it("sends the current unread count as the first SSE frame", async () => {
    const db = openDb(":memory:");
    db.insertNotification({ party: ALICE, kind: "k", title: "t", body: "b" }, 1000);

    const a = app(db);
    const port = await new Promise<number>((resolve) => {
      server = a.listen(0, () => {
        const address = server.address();
        resolve(typeof address === "object" && address ? address.port : 0);
      });
    });

    const token = await tokenFor(ALICE);
    const res = await fetch(`http://127.0.0.1:${port}/notifications/stream?token=${encodeURIComponent(token)}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const reader = res.body!.getReader();
    const { value } = await reader.read();
    const frame = new TextDecoder().decode(value);
    expect(frame).toContain("event: notifications");
    expect(frame).toContain('{"unread":1}');
    await reader.cancel();
  });
});
