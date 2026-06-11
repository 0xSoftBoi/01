// The door scanner. In production this is the scan of the pass QR; here the
// venue sees its manifest per event and taps Check in — which exercises the
// consuming Ticket_CheckIn choice, so a ticket can never be scanned twice.
import { useState } from "react";
import type Ledger from "@daml/ledger";
import { Ticket } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { Event } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { shortParty, useQuery } from "../api";

export default function DoorView({ venueLedger }: { venueLedger: Ledger }) {
  const events = useQuery(venueLedger, Event);
  const tickets = useQuery(venueLedger, Ticket);
  const [eventId, setEventId] = useState<string>("");
  const selected = eventId || events.contracts[0]?.payload.eventId || "";
  const manifest = tickets.contracts
    .filter((t) => t.payload.eventId === selected)
    .sort((a, b) => Number(a.payload.serial) - Number(b.payload.serial));

  return (
    <div className="stack">
      <div className="card">
        <div className="row spread">
          <h3>Door manifest</h3>
          <select value={selected} onChange={(e) => setEventId(e.target.value)}>
            {events.contracts.map((e) => (
              <option key={e.payload.eventId} value={e.payload.eventId}>
                {e.payload.name}
              </option>
            ))}
          </select>
        </div>
        {manifest.length === 0 && <p className="muted">No tickets issued yet.</p>}
        {manifest.map((t) => (
          <div className="level" key={t.contractId}>
            <div>
              <span className="tier">{t.payload.tierId}</span>
              <strong> #{t.payload.serial}</strong>
              <span className="muted"> · {shortParty(t.payload.owner)}</span>
            </div>
            {t.payload.redeemed ? (
              <span className="badge in">CHECKED IN</span>
            ) : (
              <button
                onClick={() =>
                  venueLedger.exercise(Ticket.Ticket_CheckIn, t.contractId as never, {})
                }
              >
                Check in
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
