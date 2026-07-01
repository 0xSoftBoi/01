import { Router } from "express";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { asyncRoute } from "./asyncRoute.js";
import type { QueryableLedger } from "./ledgerSession.js";

// Public catalog data (events, tier allocations), proxied through the
// server's own operator session. The browser gets plain JSON — never the
// operator-scoped ledger credential that produced it (AUDIT.md production
// gap #3: the demo previously minted an operator token in the browser just
// to read this).
export function catalogRouter(operatorSession: QueryableLedger) {
  const router = Router();
  router.get(
    "/catalog",
    asyncRoute(async (_req, res) => {
      const [events, allocs] = await Promise.all([
        operatorSession.query(Event),
        operatorSession.query(TierAllocation),
      ]);
      res.json({
        events: events.map((c) => ({ contractId: c.contractId, payload: c.payload })),
        allocs: allocs.map((c) => ({ contractId: c.contractId, payload: c.payload })),
      });
    }),
  );
  return router;
}
