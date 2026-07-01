// Fire-and-forget product analytics. track() queues events and the queue is
// flushed as a single POST /analytics/events batch (same origin/proxy as
// /auth and /catalog — the server answers 202) every 5 seconds or every 10
// events, whichever comes first, plus when the tab is hidden (via
// navigator.sendBeacon so the batch survives navigation/close, falling back
// to fetch keepalive). Nothing here is ever awaited by UI code and failures
// are swallowed: analytics must never affect the fan experience.
//
// DEMO_MODE (same build-time constant as api.ts) keeps all of the queue/
// flush logic intact but swaps the transport for a no-op — the static demo
// deploy has no server to receive the batch.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

interface AnalyticsEvent {
  name: string;
  props?: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 5000;
const FLUSH_AT_COUNT = 10;
const SESSION_KEY = "kyd.analytics.session";

let queue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;

// Random id persisted for the lifetime of the browser tab.
function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon"; // sessionStorage unavailable (e.g. blocked); still batch
  }
}

function send(events: AnalyticsEvent[], viaBeacon: boolean): void {
  if (DEMO_MODE) return; // no server behind the static demo deploy
  const body = JSON.stringify({ sessionId: sessionId(), events });
  if (viaBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const ok = navigator.sendBeacon("/analytics/events", new Blob([body], { type: "application/json" }));
    if (ok) return;
  }
  fetch("/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // fire-and-forget: drop the batch
  });
}

function flush(viaBeacon = false): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  send(batch, viaBeacon);
}

export function track(name: string, props?: Record<string, unknown>): void {
  queue.push(props ? { name, props } : { name });
  if (queue.length >= FLUSH_AT_COUNT) {
    flush();
    return;
  }
  if (flushTimer === null) {
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      flush();
    }, FLUSH_INTERVAL_MS);
  }
}

// Drain the queue when the tab goes to the background — the last chance to
// get the batch out before the page is frozen or discarded.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}
