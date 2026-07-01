import type { Request } from "express";
import { Router } from "express";
import { asyncRoute } from "./asyncRoute.js";
import { verifyToken } from "./verify.js";
import type { KydDb } from "./db.js";

// Same session check as payments.ts: the party is whatever `sub` the
// verified token carries — a caller can only ever see or mark their own
// rows, because the party is never taken from the request body or URL.
async function partyFromBearer(req: Request): Promise<string> {
  const auth = req.header("authorization");
  return partyFromToken(auth?.replace(/^Bearer\s+/i, "") ?? "");
}

async function partyFromToken(token: string): Promise<string> {
  const payload = await verifyToken(token);
  if (typeof payload.sub !== "string") throw new Error("token has no subject");
  return payload.sub;
}

const LIST_LIMIT = 50;
const READ_BATCH_LIMIT = 100;
const STREAM_POLL_MS = 2_000;
const STREAM_HEARTBEAT_MS = 25_000;

export function notificationsRouter(db: KydDb) {
  const router = Router();

  router.get(
    "/notifications",
    asyncRoute(async (req, res) => {
      let party: string;
      try {
        party = await partyFromBearer(req);
      } catch {
        res.status(401).json({ error: "invalid or expired session" });
        return;
      }
      res.json({ notifications: db.listNotifications(party, LIST_LIMIT) });
    }),
  );

  router.post(
    "/notifications/read",
    asyncRoute(async (req, res) => {
      let party: string;
      try {
        party = await partyFromBearer(req);
      } catch {
        res.status(401).json({ error: "invalid or expired session" });
        return;
      }
      const ids: unknown = req.body?.ids;
      const valid =
        Array.isArray(ids) && ids.length <= READ_BATCH_LIMIT && ids.every((id) => Number.isInteger(id));
      if (!valid) {
        res.status(400).json({ error: `ids must be an array of at most ${READ_BATCH_LIMIT} integers` });
        return;
      }
      // Ids belonging to other parties are silently skipped, not rejected:
      // the db-level WHERE party = ? scope (db.ts) makes them unmatchable,
      // and refusing the batch would leak which ids exist for someone else.
      res.json({ updated: db.markNotificationsRead(party, ids as number[]) });
    }),
  );

  // EventSource can't set an Authorization header, so the token rides the
  // query string — verified with the exact same check as the Bearer routes.
  // Pushes only the unread COUNT, never notification content: the content
  // fetch stays on the authenticated GET above, so a leaked stream URL in a
  // proxy log exposes at most a number.
  router.get(
    "/notifications/stream",
    asyncRoute(async (req, res) => {
      let party: string;
      try {
        party = await partyFromToken(typeof req.query.token === "string" ? req.query.token : "");
      } catch {
        res.status(401).json({ error: "invalid or expired session" });
        return;
      }

      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });

      const send = (unread: number) => {
        res.write(`event: notifications\ndata: ${JSON.stringify({ unread })}\n\n`);
      };
      let last = db.countUnreadNotifications(party);
      send(last);

      const poll = setInterval(() => {
        const unread = db.countUnreadNotifications(party);
        if (unread !== last) {
          last = unread;
          send(unread);
        }
      }, STREAM_POLL_MS);
      // Comment frames keep intermediaries from timing out an idle stream.
      const heartbeat = setInterval(() => res.write(`: heartbeat\n\n`), STREAM_HEARTBEAT_MS);
      poll.unref();
      heartbeat.unref();

      req.on("close", () => {
        clearInterval(poll);
        clearInterval(heartbeat);
      });
    }),
  );

  return router;
}
