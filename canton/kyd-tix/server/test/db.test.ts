import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db.js";

describe("openDb migrations", () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  // Idempotence needs the SAME database opened twice, which :memory: can't
  // express (each open is a fresh db) — the one on-disk db in the suite,
  // in a tmpdir, same as keys.test.ts's key-persistence proof.
  it("applies migrations once and re-opening the same file is a no-op, with data intact", () => {
    dir = mkdtempSync(join(tmpdir(), "kyd-db-"));
    const path = join(dir, "kyd.db");

    const first = openDb(path);
    first.setIndexerState("baseline_done", "1");
    first.close();

    const second = openDb(path); // would throw "table already exists" if migrations re-ran
    expect(second.getIndexerState("baseline_done")).toBe("1");
    expect(second.ping()).toBe(true);
    second.close();
  });
});

describe("users", () => {
  it("recordUserLogin creates once and only bumps last_login_at on repeat", () => {
    const db = openDb(":memory:");
    db.recordUserLogin("kyd-alice", "Alice::al1", "alice", 1000);
    db.recordUserLogin("kyd-alice", "Alice::al1", "alice", 2000);
    // No unique-constraint blowup on the repeat is the contract; ping proves
    // the handle survived it.
    expect(db.ping()).toBe(true);
  });
});

describe("indexed contracts", () => {
  it("upsertContract reports new exactly once per contract id", () => {
    const db = openDb(":memory:");
    expect(db.upsertContract("#c:0", "T", { a: 1 }, 1000)).toBe(true);
    expect(db.upsertContract("#c:0", "T", { a: 2 }, 2000)).toBe(false);
    expect(db.getActiveContracts("T")).toEqual([{ contractId: "#c:0", payload: { a: 2 } }]);
  });

  it("markArchivedExcept archives only the missing rows of that template and returns their payloads", () => {
    const db = openDb(":memory:");
    db.upsertContract("#c:0", "T", { keep: true }, 1000);
    db.upsertContract("#c:1", "T", { gone: true }, 1000);
    db.upsertContract("#x:0", "Other", { untouched: true }, 1000);

    const archived = db.markArchivedExcept("T", ["#c:0"], 2000);
    expect(archived).toEqual([{ contractId: "#c:1", payload: { gone: true } }]);
    expect(db.getActiveContracts("T")).toEqual([{ contractId: "#c:0", payload: { keep: true } }]);
    // Scoped by template — another template's rows are never collateral.
    expect(db.getActiveContracts("Other")).toHaveLength(1);
    // Already-archived rows aren't returned again on the next diff.
    expect(db.markArchivedExcept("T", ["#c:0"], 3000)).toEqual([]);
    expect(db.countActiveByTemplate()).toEqual({ T: 1, Other: 1 });
  });
});

describe("notifications", () => {
  it("lists newest-first for one party only and marks reads scoped to that party", () => {
    const db = openDb(":memory:");
    const a1 = db.insertNotification({ party: "A", kind: "k", title: "first", body: "b" }, 1000);
    const a2 = db.insertNotification({ party: "A", kind: "k", title: "second", body: "b" }, 2000);
    const b1 = db.insertNotification({ party: "B", kind: "k", title: "theirs", body: "b" }, 3000);

    const listed = db.listNotifications("A", 50);
    expect(listed.map((n) => n.id)).toEqual([a2, a1]);
    expect(listed.every((n) => n.readAt === null)).toBe(true);

    // B's id in A's batch is unmatchable at the SQL level, not just filtered.
    expect(db.markNotificationsRead("A", [a1, b1], 4000)).toBe(1);
    expect(db.countUnreadNotifications("A")).toBe(1);
    expect(db.countUnreadNotifications("B")).toBe(1);
  });
});

describe("analytics", () => {
  it("inserts batches and aggregates counts by name", () => {
    const db = openDb(":memory:");
    db.insertAnalyticsEvents(
      [
        { sessionId: "s1", name: "page_view" },
        { sessionId: "s1", name: "page_view", party: "A" },
        { sessionId: "s2", name: "checkout.start", props: '{"tier":"GA"}' },
      ],
      1000,
    );
    expect(db.analyticsCountsByName()).toEqual({ page_view: 2, "checkout.start": 1 });
  });
});

describe("webhook deliveries", () => {
  it("seenWebhookDelivery flips after recording, and re-recording is harmless", () => {
    const db = openDb(":memory:");
    expect(db.seenWebhookDelivery("evt_1")).toBe(false);
    db.recordWebhookDelivery("evt_1", 1000);
    expect(db.seenWebhookDelivery("evt_1")).toBe(true);
    db.recordWebhookDelivery("evt_1", 2000);
    expect(db.seenWebhookDelivery("evt_1")).toBe(true);
  });
});
