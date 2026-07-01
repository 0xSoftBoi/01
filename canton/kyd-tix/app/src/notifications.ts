// Notifications: list + unread state for the bell in the app header.
//
// Structured exactly like api.ts's useSession/useCatalog: DEMO_MODE is a
// build-time constant (import.meta.env), so the demo branch below is stable
// for the lifetime of every component instance and may safely call its own
// hooks — as long as every hook inside each branch is called unconditionally
// on every render (see the rules-of-hooks notes in api.ts; a previous
// regression came from violating this).
//
// Live mode talks to the same origin/proxy the app already uses for /auth
// and /catalog (vite.config.ts proxies both to the server):
//   GET  /notifications          (Authorization: Bearer <session token>)
//   POST /notifications/read     ({ ids: number[] })
//   GET  /notifications/stream?token=<jwt>   (SSE, `event: notifications`)
// DEMO_MODE sources everything from src/demo/mock.ts's in-browser
// notifications store instead — no server exists behind the static deploy.
import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_MODE, Session, useDemoModule } from "./api";

export interface AppNotification {
  id: number;
  kind: string;
  title: string;
  body: string;
  contractId: string | null;
  createdAt: number; // epoch millis (normalized — the server may send seconds)
  readAt: number | null;
}

export interface NotificationsResult {
  items: AppNotification[]; // newest first
  unread: number;
  markRead: (ids: number[]) => Promise<void>;
  refresh: () => Promise<void>;
}

// The contract allows createdAt/readAt as epoch millis or seconds; anything
// under 1e12 (~2001 in millis) is treated as seconds. Renderers downstream
// stay defensive anyway (relTime in NotificationsBell).
function toMillis(t: number | null | undefined): number | null {
  if (t === null || t === undefined || !Number.isFinite(t)) return null;
  return t < 1e12 ? t * 1000 : t;
}

function normalize(raw: AppNotification[]): AppNotification[] {
  return raw
    .map((n) => ({ ...n, createdAt: toMillis(n.createdAt) ?? Date.now(), readAt: toMillis(n.readAt) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function fetchList(token: string): Promise<AppNotification[]> {
  const res = await fetch("/notifications", { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("notifications fetch failed");
  const body = (await res.json()) as { notifications: AppNotification[] };
  return normalize(body.notifications ?? []);
}

export function useNotifications(session: Session | null): NotificationsResult {
  // Depend on the primitive fields, not the session object: DEMO_MODE's
  // useSession returns a fresh object every render.
  const party = session?.party ?? null;
  const token = session?.token ?? null;

  // eslint-disable-next-line react-hooks/rules-of-hooks -- DEMO_MODE is a
  // build-time constant, never toggles across renders (see useSession in
  // api.ts). useDemoModule + useState + useEffect + the two useCallbacks are
  // the ONLY hooks in this branch, always called every render regardless of
  // whether `mod` has resolved yet.
  if (DEMO_MODE) {
    const mod = useDemoModule();
    const [items, setItems] = useState<AppNotification[]>([]);
    useEffect(() => {
      if (!mod || !party) {
        setItems([]);
        return;
      }
      const read = () => setItems(normalize(mod.listNotifications(party)));
      read();
      return mod.subscribeNotifications(read);
    }, [mod, party]);
    const markRead = useCallback(
      async (ids: number[]) => {
        if (mod && ids.length > 0) mod.markNotificationsRead(ids);
      },
      [mod],
    );
    const refresh = useCallback(async () => {
      if (mod && party) setItems(normalize(mod.listNotifications(party)));
    }, [mod, party]);
    return { items, unread: items.filter((n) => n.readAt === null).length, markRead, refresh };
  }

  const [items, setItems] = useState<AppNotification[]>([]);
  const lastUnread = useRef(-1);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await fetchList(token));
    } catch {
      // keep last good state; the stack may still be booting
    }
  }, [token]);

  // Fetch the list once per session, then hold an SSE subscription open for
  // unread-count pushes — refetching the list whenever the count changes.
  // Reconnects with exponential backoff on error; torn down on unmount or
  // session change.
  useEffect(() => {
    if (!token) {
      setItems([]);
      return;
    }
    let live = true;
    let es: EventSource | null = null;
    let retry: number | undefined;
    let backoff = 1000;
    const load = async () => {
      try {
        const list = await fetchList(token);
        if (live) setItems(list);
      } catch {
        // keep last good state
      }
    };
    const connect = () => {
      if (!live) return;
      es = new EventSource(`/notifications/stream?token=${encodeURIComponent(token)}`);
      es.onopen = () => {
        backoff = 1000;
      };
      es.addEventListener("notifications", (e) => {
        try {
          const { unread } = JSON.parse((e as MessageEvent).data) as { unread: number };
          if (unread !== lastUnread.current) {
            lastUnread.current = unread;
            load();
          }
        } catch {
          // ignore malformed frames
        }
      });
      es.onerror = () => {
        es?.close();
        es = null;
        retry = window.setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 30000);
      };
    };
    lastUnread.current = -1;
    load();
    connect();
    return () => {
      live = false;
      es?.close();
      if (retry !== undefined) clearTimeout(retry);
    };
  }, [token]);

  const markRead = useCallback(
    async (ids: number[]) => {
      if (!token || ids.length === 0) return;
      // Optimistic: clear the accent bars / badge immediately; the next
      // SSE-triggered refetch reconciles with the server's view.
      const at = Date.now();
      setItems((prev) => prev.map((n) => (ids.includes(n.id) && n.readAt === null ? { ...n, readAt: at } : n)));
      try {
        await fetch("/notifications/read", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids }),
        });
      } catch {
        // optimistic update stands; the next refetch reconciles
      }
    },
    [token],
  );

  return { items, unread: items.filter((n) => n.readAt === null).length, markRead, refresh };
}
