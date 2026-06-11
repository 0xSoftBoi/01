// Discover + one-tap buy. The catalog (events, open price levels) is served
// via the operator's read — the on-ledger equivalent of KYD's backend catalog
// API — while the purchase itself is signed by the FAN's own party. The fan
// sees: a show, a price, a Buy button. No wallets, no gas, no jargon.
import { useState } from "react";
import type Ledger from "@daml/ledger";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { DemoParties, fmtMoney, placeOrder, useQuery } from "../api";

interface Props {
  catalog: Ledger; // operator-read catalog service
  fanLedger: Ledger; // the signed-in fan
  fan: string;
  parties: DemoParties;
}

export default function EventsView({ catalog, fanLedger, fan, parties }: Props) {
  const events = useQuery(catalog, Event);
  const allocs = useQuery(catalog, TierAllocation);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (eventId: string, tierId: string, price: number, key: string) => {
    setBusy(key);
    setError(null);
    try {
      await placeOrder(fanLedger, parties, fan, eventId, tierId, price);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stack">
      {error && <div className="banner error">{error}</div>}
      {events.contracts.map(({ payload: ev }) => {
        const levels = allocs.contracts
          .filter((a) => a.payload.eventId === ev.eventId)
          .map((a) => a.payload)
          .filter((a) => Number(a.sold) < Number(a.size))
          .sort((a, b) => Number(a.price) - Number(b.price));
        return (
          <div className="card event" key={ev.eventId}>
            <div className="event-head">
              <h2>{ev.name}</h2>
              <span className="muted">
                {new Date(ev.eventTime).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {levels.length === 0 && <p className="muted">No tickets on sale right now.</p>}
            {levels.map((a) => {
              const left = Number(a.size) - Number(a.sold);
              const key = `${ev.eventId}/${a.tierId}/${a.serialBase}`;
              return (
                <div className="level" key={key}>
                  <div>
                    <span className="tier">{a.tierId}</span>
                    <span className="price">{fmtMoney(a.price)}</span>
                    <span className="muted"> · {left} left at this price</span>
                  </div>
                  <button
                    disabled={busy !== null}
                    onClick={() => buy(ev.eventId, a.tierId, Number(a.price), key)}
                  >
                    {busy === key ? "Processing…" : "Buy"}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
