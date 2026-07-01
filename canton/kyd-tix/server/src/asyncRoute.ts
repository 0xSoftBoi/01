import type { Request, RequestHandler, Response } from "express";

// Express 4 does not catch a rejected promise returned from an async route
// handler — it becomes an unhandled rejection that crashes the whole
// process (found live: a ledger client construction bug took down this
// server mid-request during manual end-to-end testing). Every route that
// talks to the ledger goes through this so a transient failure there is a
// 502 to the caller, not a downed server.
export function asyncRoute(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res) => {
    handler(req, res).catch((err: unknown) => {
      console.error(err);
      if (!res.headersSent) res.status(502).json({ error: "internal error" });
    });
  };
}
