import { Router } from "express";
import { asyncRoute } from "./asyncRoute.js";
import { keySet } from "./keys.js";
import { metrics } from "./metrics.js";
import type { KydDb } from "./db.js";

// last_run_at is written every successful poll (indexer.ts); anything older
// than this means the indexer is wedged even if the process is up.
const INDEXER_STALE_SECONDS = 5 * 60;

export interface OpsDeps {
  db: Pick<KydDb, "ping" | "getIndexerState">;
  // Injectable so tests don't need a ledger: index.ts wires a cheap
  // operator-session query wrapped in a timeout.
  ledgerProbe: () => Promise<unknown>;
  indexerEnabled: boolean;
  now?: () => number;
}

interface Check {
  ok: boolean;
  info?: string;
}

// GET /health (index.ts) stays as the dumb liveness probe existing tooling
// points at; /healthz is the readiness view that actually inspects the
// dependencies, per-check, so an alert says WHICH leg is down.
export function opsRouter(deps: OpsDeps) {
  const router = Router();
  const now = deps.now ?? Date.now;

  router.get(
    "/healthz",
    asyncRoute(async (_req, res) => {
      const checks: Record<string, Check> = {};

      try {
        checks.db = { ok: deps.db.ping() };
      } catch (err) {
        checks.db = { ok: false, info: err instanceof Error ? err.message : String(err) };
      }

      try {
        await keySet();
        checks.signingKey = { ok: true };
      } catch (err) {
        checks.signingKey = { ok: false, info: err instanceof Error ? err.message : String(err) };
      }

      if (!deps.indexerEnabled) {
        // Not running is a deliberate deployment choice (INDEXER_DISABLED),
        // not a failure — report it, don't page on it.
        checks.indexer = { ok: true, info: "disabled" };
      } else {
        const lastRunAt = Number(deps.db.getIndexerState("last_run_at") ?? NaN);
        const ageSeconds = Math.floor(now() / 1000) - lastRunAt;
        checks.indexer =
          Number.isFinite(lastRunAt) && ageSeconds <= INDEXER_STALE_SECONDS
            ? { ok: true }
            : { ok: false, info: Number.isFinite(lastRunAt) ? `last run ${ageSeconds}s ago` : "never ran" };
      }

      try {
        await deps.ledgerProbe();
        checks.ledger = { ok: true };
      } catch (err) {
        checks.ledger = { ok: false, info: err instanceof Error ? err.message : String(err) };
      }

      const ok = Object.values(checks).every((c) => c.ok);
      res.status(ok ? 200 : 503).json({ ok, checks });
    }),
  );

  router.get("/metrics", (_req, res) => {
    res.type("text/plain; version=0.0.4; charset=utf-8").send(metrics.render());
  });

  return router;
}
