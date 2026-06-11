// The artist's view: royalties land here automatically on every capped
// resale — the artist signed the event once and the splits are contract law.
import type Ledger from "@daml/ledger";
import { Event } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { Ticket } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { fmtMoney, useBalance, useQuery } from "../api";

export default function ArtistView({ artistLedger, artist }: { artistLedger: Ledger; artist: string }) {
  const balance = useBalance(artistLedger, artist);
  const events = useQuery(artistLedger, Event);
  const tickets = useQuery(artistLedger, Ticket);

  return (
    <div className="stack">
      <div className="card">
        <h3>Royalties collected</h3>
        <div className="big-number">{fmtMoney(balance)}</div>
        <p className="muted">
          10% of every resale, split atomically in the same transaction that moves the ticket.
          No marketplace cooperation required — it is unbypassable by construction.
        </p>
      </div>
      {events.contracts.map((ev) => {
        const sold = tickets.contracts.filter((t) => t.payload.eventId === ev.payload.eventId);
        return (
          <div className="card" key={ev.payload.eventId}>
            <h3>{ev.payload.name}</h3>
            <p className="muted">
              {sold.length} ticket{sold.length === 1 ? "" : "s"} live · fan identities visible to
              you as event signatory — your fan data, not a platform's.
            </p>
          </div>
        );
      })}
    </div>
  );
}
