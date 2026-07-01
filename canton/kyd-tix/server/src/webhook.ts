import { Router, raw } from "express";
import { asyncRoute } from "./asyncRoute.js";
import { processPspWebhook } from "./psp.js";
import type { MintableLedger } from "./ledgerSession.js";

// Mounted BEFORE the global express.json() body parser (see index.ts): the
// signature is computed over the exact bytes the PSP sent, so this route
// needs the raw body, not a re-serialized JSON object.
export function webhookRouter(session: MintableLedger, operatorParty: string) {
  const router = Router();
  router.post(
    "/webhooks/psp",
    raw({ type: "application/json" }),
    asyncRoute(async (req, res) => {
      const result = await processPspWebhook(
        req.body as Buffer,
        req.header("x-webhook-signature"),
        session,
        operatorParty,
      );
      res.status(result.status).json(result.body);
    }),
  );
  return router;
}
