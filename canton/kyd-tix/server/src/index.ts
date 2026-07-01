import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";
import { jwksRouter } from "./jwks.js";
import { authRouter } from "./identity.js";
import { catalogRouter } from "./catalog.js";
import { webhookRouter } from "./webhook.js";
import { paymentsRouter } from "./payments.js";
import { LedgerSession } from "./ledgerSession.js";
import { loadDemoParties } from "./demoParties.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 4001);
const JSON_API_URL = process.env.JSON_API_URL ?? "http://localhost:7575";
const DEMO_PARTIES_PATH =
  process.env.DEMO_PARTIES_PATH ?? join(__dirname, "..", "..", "app", "public", "demo-parties.json");

function main() {
  const parties = loadDemoParties(DEMO_PARTIES_PATH);
  const operatorSession = new LedgerSession(parties.operator, JSON_API_URL);

  const app = express();

  // No body parsing needed.
  app.use(jwksRouter);

  // Has its own raw() body parser scoped to /webhooks/psp — must be mounted
  // before the global express.json() below, or the signature check would run
  // against a re-serialized (and therefore different) body.
  app.use(webhookRouter(operatorSession, parties.operator));

  app.use(express.json());
  app.use(authRouter(parties, JSON_API_URL));
  app.use(catalogRouter(operatorSession));
  app.use(paymentsRouter(operatorSession, parties.operator));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`kyd-tix server (auth + catalog + payments) on :${PORT}, JSON API at ${JSON_API_URL}`);
  });
}

main();
