import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";
import { Event } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { jwksRouter } from "./jwks.js";
import { authRouter } from "./identity.js";
import { catalogRouter } from "./catalog.js";
import { webhookRouter } from "./webhook.js";
import { paymentsRouter } from "./payments.js";
import { notificationsRouter } from "./notificationsApi.js";
import { analyticsRouter } from "./analyticsApi.js";
import { opsRouter } from "./ops.js";
import { httpMetricsMiddleware } from "./metrics.js";
import { openDb } from "./db.js";
import { Indexer } from "./indexer.js";
import { ensureUserForParty } from "./userManagement.js";
import { LedgerSession } from "./ledgerSession.js";
import { loadDemoParties } from "./demoParties.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 4001);
const JSON_API_URL = process.env.JSON_API_URL ?? "http://localhost:7575";
const DEMO_PARTIES_PATH =
  process.env.DEMO_PARTIES_PATH ?? join(__dirname, "..", "..", "app", "public", "demo-parties.json");
const DB_PATH = process.env.DB_PATH ?? join(__dirname, "..", "data", "kyd.db");
const INDEXER_INTERVAL_MS = Number(process.env.INDEXER_INTERVAL_MS ?? 5000);
// INDEXER_DISABLED=1 for environments with no ledger to poll (e.g. serving
// only the auth/JWKS side) — /healthz reports the indexer as "disabled"
// rather than stale.
const INDEXER_ENABLED = process.env.INDEXER_DISABLED !== "1";

function main() {
  const parties = loadDemoParties(DEMO_PARTIES_PATH);
  const operatorSession = new LedgerSession(parties.operator, JSON_API_URL);
  const db = openDb(DB_PATH);

  const indexer = new Indexer(operatorSession, db);
  if (INDEXER_ENABLED) indexer.start(INDEXER_INTERVAL_MS);

  const app = express();

  // Before every route so 401s/404s are counted too.
  app.use(httpMetricsMiddleware());

  // No body parsing needed.
  app.use(jwksRouter);

  // Has its own raw() body parser scoped to /webhooks/psp — must be mounted
  // before the global express.json() below, or the signature check would run
  // against a re-serialized (and therefore different) body.
  app.use(webhookRouter(operatorSession, parties.operator, db));

  app.use(express.json());
  app.use(authRouter(parties, JSON_API_URL, ensureUserForParty, db));
  app.use(catalogRouter(operatorSession));
  app.use(paymentsRouter(operatorSession, parties.operator, db));
  app.use(notificationsRouter(db));
  app.use(analyticsRouter(db, parties.operator));

  // A cheap single-template ACS read as the ledger probe, capped so a hung
  // JSON API turns into a failed check instead of a hung /healthz.
  const ledgerProbe = () =>
    Promise.race([
      operatorSession.query(Event),
      new Promise((_, reject) => setTimeout(() => reject(new Error("ledger probe timed out")), 2000).unref()),
    ]);
  app.use(opsRouter({ db, ledgerProbe, indexerEnabled: INDEXER_ENABLED }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`kyd-tix server (auth + catalog + payments) on :${PORT}, JSON API at ${JSON_API_URL}`);
  });
}

main();
