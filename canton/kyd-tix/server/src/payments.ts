import { randomUUID } from "node:crypto";
import { Router } from "express";
import { asyncRoute } from "./asyncRoute.js";
import { verifyToken } from "./verify.js";
import { processPspWebhook, signPspEvent, type DeliveryStore } from "./psp.js";
import type { MintableLedger } from "./ledgerSession.js";

// Customer-facing on-ramp: requires the FAN's own session token (not the
// operator's), so a request can only ever top up the party that logged in —
// mirroring how a real PSP checkout is bound to the authenticated customer.
// This demo has no real card processor to round-trip through, so it
// synthesizes the exact signed webhook event the PSP would send once a real
// charge clears, and runs it through processPspWebhook — the identical
// signature-checked function webhook.ts uses for a genuine external POST.
export function paymentsRouter(session: MintableLedger, operatorParty: string, deliveries?: DeliveryStore) {
  const router = Router();

  router.post(
    "/payments/topup",
    asyncRoute(async (req, res) => {
      let fanParty: string;
      try {
        const auth = req.header("authorization");
        const payload = await verifyToken(auth?.replace(/^Bearer\s+/i, "") ?? "");
        if (typeof payload.sub !== "string") throw new Error("token has no subject");
        fanParty = payload.sub;
      } catch {
        res.status(401).json({ error: "invalid or expired session" });
        return;
      }

      const amount = Number(req.body?.amount);
      if (!Number.isFinite(amount) || !(amount > 0)) {
        res.status(400).json({ error: "amount must be positive" });
        return;
      }

      // A fresh event id per request: top-ups are intentionally repeatable
      // (two identical $40 top-ups are two real charges), so each synthesized
      // event must be a distinct "delivery" to processPspWebhook's dedup —
      // unlike a real PSP retry, which re-sends the same event id and bytes.
      const body = JSON.stringify({
        id: `topup-${randomUUID()}`,
        type: "charge.succeeded",
        data: { fanParty, amount },
      });
      const result = await processPspWebhook(Buffer.from(body), signPspEvent(body), session, operatorParty, deliveries);
      res.status(result.status).json(result.body);
    }),
  );

  return router;
}
