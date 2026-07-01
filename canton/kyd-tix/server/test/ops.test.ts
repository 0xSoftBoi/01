import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { opsRouter } from "../src/ops.js";
import { httpMetricsMiddleware } from "../src/metrics.js";
import { openDb, type KydDb } from "../src/db.js";

function healthApp(db: KydDb, ledgerProbe: () => Promise<unknown>, indexerEnabled = true) {
  const a = express();
  a.use(opsRouter({ db, ledgerProbe, indexerEnabled, now: () => 100_000 * 1000 }));
  return a;
}

describe("GET /healthz", () => {
  it("is 200 with every check green when all dependencies answer", async () => {
    const db = openDb(":memory:");
    db.setIndexerState("last_run_at", String(100_000 - 30)); // ran 30s "ago"
    const res = await request(healthApp(db, async () => [])).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.checks).toMatchObject({
      db: { ok: true },
      signingKey: { ok: true },
      indexer: { ok: true },
      ledger: { ok: true },
    });
  });

  it("is 503 naming the ledger check when the probe rejects", async () => {
    const db = openDb(":memory:");
    db.setIndexerState("last_run_at", String(100_000 - 30));
    const res = await request(
      healthApp(db, async () => {
        throw new Error("ledger probe timed out");
      }),
    ).get("/healthz");
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.checks.ledger).toEqual({ ok: false, info: "ledger probe timed out" });
    // The other legs still report independently — that's the point of /healthz.
    expect(res.body.checks.db.ok).toBe(true);
  });

  it("treats a stale indexer as unhealthy but a disabled one as a deliberate choice", async () => {
    const db = openDb(":memory:");
    db.setIndexerState("last_run_at", String(100_000 - 600)); // 10 minutes ago
    const stale = await request(healthApp(db, async () => [])).get("/healthz");
    expect(stale.status).toBe(503);
    expect(stale.body.checks.indexer.ok).toBe(false);

    const disabled = await request(healthApp(db, async () => [], false)).get("/healthz");
    expect(disabled.status).toBe(200);
    expect(disabled.body.checks.indexer).toEqual({ ok: true, info: "disabled" });
  });
});

describe("GET /metrics", () => {
  it("exposes http_requests_total in Prometheus text format after a request", async () => {
    const db = openDb(":memory:");
    const a = express();
    a.use(httpMetricsMiddleware());
    a.get("/catalog", (_req, res) => res.json({ events: [] }));
    a.use(opsRouter({ db, ledgerProbe: async () => [], indexerEnabled: false }));

    await request(a).get("/catalog");
    const res = await request(a).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("# TYPE http_requests_total counter");
    expect(res.text).toMatch(/http_requests_total\{method="GET",route="\/catalog",status="200"\} \d+/);
  });

  it("buckets unmatched paths as \"other\" so scanners can't mint unbounded series", async () => {
    const a = express();
    a.use(httpMetricsMiddleware());
    a.use(opsRouter({ db: openDb(":memory:"), ledgerProbe: async () => [], indexerEnabled: false }));

    await request(a).get("/definitely/not/a/route/12345");
    const res = await request(a).get("/metrics");
    expect(res.text).toMatch(/http_requests_total\{method="GET",route="other",status="404"\} \d+/);
    expect(res.text).not.toContain("12345");
  });
});
