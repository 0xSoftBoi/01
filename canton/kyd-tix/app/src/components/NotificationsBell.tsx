// The notifications bell + dropdown panel in the app header. All state comes
// from useNotifications (src/notifications.ts): live SSE + fetch against the
// server, or the in-browser mock store under DEMO_MODE — this component
// doesn't know or care which.
import { useEffect, useRef, useState } from "react";
import type { Session } from "../api";
import { useNotifications } from "../notifications";

// Defensive relative time: createdAt is normalized to epoch millis by
// useNotifications, but clock skew (or a server sending a slightly-future
// timestamp) must never render "-1m ago".
function relTime(createdAt: number): string {
  const ms = Number.isFinite(createdAt) ? createdAt : Date.now();
  const diff = Date.now() - ms;
  if (diff < 45 * 1000) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Same stroke language as LogoIcon (src/Logo.tsx): currentColor stroke,
// square caps, miter joins.
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4a6 6 0 0 0-6 6v5l-2 3h16l-2-3v-5a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export default function NotificationsBell({ session }: { session: Session }) {
  const { items, unread, markRead } = useNotifications(session);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Opening the panel marks the visible items read after a beat — long
  // enough to register the accent bars, short enough that the badge clears
  // naturally while you're looking.
  useEffect(() => {
    if (!open) return;
    const ids = items.filter((n) => n.readAt === null).map((n) => n.id);
    if (ids.length === 0) return;
    const t = setTimeout(() => markRead(ids), 1500);
    return () => clearTimeout(t);
  }, [open, items, markRead]);

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        className="bell"
        aria-label={unread > 0 ? `Notifications — ${unread} unread` : "Notifications"}
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon />
        {unread > 0 && <span className="bell-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          {items.length === 0 ? (
            <div className="notif-empty">Nothing yet — offers and ticket deliveries land here.</div>
          ) : (
            items.map((n) => (
              <div className={`notif-row ${n.readAt === null ? "unread" : ""}`} key={n.id}>
                <p className="notif-title">{n.title}</p>
                <p className="notif-body">{n.body}</p>
                <span className="notif-time">{relTime(n.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
