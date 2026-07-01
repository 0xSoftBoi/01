import { Router } from "express";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { Ticket, GiftOffer, ResaleOffer, DvPResaleOffer } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { SyndicatedLoan, TrancheOffer } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Tix";
import { asyncRoute } from "./asyncRoute.js";
import { verifyToken } from "./verify.js";
import type { AnalyticsEventInput, KydDb } from "./db.js";

// Ingest limits: everything here is attacker-controlled (the endpoint is
// deliberately unauthenticated — the funnel starts before login), so every
// field is bounded and the event name is a closed grammar, not free text.
const MAX_SESSION_ID = 64;
const MAX_BATCH = 20;
const MAX_PROPS_BYTES = 2 * 1024;
const NAME_PATTERN = /^[a-z][a-z0-9_.]{0,63}$/;

export function analyticsRouter(db: KydDb, operatorParty: string) {
  const router = Router();

  router.post(
    "/analytics/events",
    asyncRoute(async (req, res) => {
      // Anonymous is fine; a valid session just enriches the row. An INVALID
      // token is treated as anonymous rather than rejected — a stale session
      // shouldn't drop funnel data.
      let party: string | undefined;
      const auth = req.header("authorization");
      if (auth) {
        try {
          const payload = await verifyToken(auth.replace(/^Bearer\s+/i, ""));
          if (typeof payload.sub === "string") party = payload.sub;
        } catch {
          party = undefined;
        }
      }

      const sessionId: unknown = req.body?.sessionId;
      const events: unknown = req.body?.events;
      if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > MAX_SESSION_ID) {
        res.status(400).json({ error: `sessionId must be a string of at most ${MAX_SESSION_ID} chars` });
        return;
      }
      if (!Array.isArray(events) || events.length > MAX_BATCH) {
        res.status(400).json({ error: `events must be an array of at most ${MAX_BATCH} items` });
        return;
      }

      const rows: AnalyticsEventInput[] = [];
      for (const e of events as { name?: unknown; props?: unknown }[]) {
        if (typeof e?.name !== "string" || !NAME_PATTERN.test(e.name)) {
          res.status(400).json({ error: "event name must match ^[a-z][a-z0-9_.]{0,63}$" });
          return;
        }
        let props: string | undefined;
        if (e.props !== undefined) {
          props = JSON.stringify(e.props);
          if (Buffer.byteLength(props) > MAX_PROPS_BYTES) {
            res.status(400).json({ error: `props must serialize to at most ${MAX_PROPS_BYTES} bytes` });
            return;
          }
        }
        rows.push({ sessionId, party, name: e.name, props });
      }

      res.status(202).json({ accepted: db.insertAnalyticsEvents(rows) });
    }),
  );

  // Operator-only: aggregates over ALL parties' funnels and the whole
  // indexed ACS — exactly the cross-party view a fan session must never get.
  router.get(
    "/analytics/summary",
    asyncRoute(async (req, res) => {
      let subject: string;
      try {
        const auth = req.header("authorization");
        const payload = await verifyToken(auth?.replace(/^Bearer\s+/i, "") ?? "");
        if (typeof payload.sub !== "string") throw new Error("token has no subject");
        subject = payload.sub;
      } catch {
        res.status(401).json({ error: "invalid or expired session" });
        return;
      }
      if (subject !== operatorParty) {
        res.status(403).json({ error: "operator only" });
        return;
      }

      // Counted from the indexer's read model, not a live ledger query —
      // this endpoint stays cheap and available even when the ledger isn't.
      const active = db.countActiveByTemplate();
      const count = (templateId: string) => active[templateId] ?? 0;
      res.json({
        clientEvents: db.analyticsCountsByName(),
        ledger: {
          events: count(Event.templateId),
          allocations: count(TierAllocation.templateId),
          ticketsActive: count(Ticket.templateId),
          offersOpen: count(GiftOffer.templateId) + count(TrancheOffer.templateId),
          resalesOpen: count(ResaleOffer.templateId) + count(DvPResaleOffer.templateId),
          loansActive: count(SyndicatedLoan.templateId),
        },
      });
    }),
  );

  return router;
}
