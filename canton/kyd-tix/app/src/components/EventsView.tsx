// Discover + one-tap buy. Catalog reads via the operator (KYD's backend role);
// the purchase is signed by the FAN's own party. The fan sees: cover art, a
// price, a Buy button. Insufficient balance opens the wallet instead of an
// error; success jumps straight to the materializing pass.
import { useState } from "react";
import type Ledger from "@daml/ledger";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { DemoParties, QueryResult, coverHues, fmtMoney, placeOrder } from "../api";
import { track } from "../analytics";
import { useToast } from "../Toast";

interface Props {
  events: QueryResult<Event>;
  allocs: QueryResult<TierAllocation>;
  fanLedger: Ledger;
  fan: string;
  parties: DemoParties;
  balance: number;
  onNeedFunds: () => void;
  onPurchased: () => void;
}

export default function EventsView({
  events,
  allocs,
  fanLedger,
  fan,
  parties,
  balance,
  onNeedFunds,
  onPurchased,
}: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (eventId: string, name: string, tierId: string, price: number, key: string) => {
    if (balance < price) {
      toast("info", "Add funds to complete this purchase");
      onNeedFunds();
      return;
    }
    setBusy(key);
    track("buy_initiated", { eventId, tierId, price });
    try {
      await placeOrder(fanLedger, parties, fan, eventId, tierId, price);
      track("buy_succeeded", { eventId, tierId, price });
      toast("ok", `You're in — issuing your ${tierId} ticket for ${name}`);
      onPurchased();
    } catch {
      toast("err", "Purchase failed — please try again");
    } finally {
      setBusy(null);
    }
  };

  if (events.loading)
    return (
      <div className="stack">
        <div className="skeleton cover" />
        <div className="skeleton cover" />
      </div>
    );

  return (
    <div className="stack">
      {events.contracts.map(({ payload: ev }) => {
        const [h1, h2] = coverHues(ev.eventId);
        const levels = allocs.contracts
          .filter((a) => a.payload.eventId === ev.eventId)
          .map((a) => a.payload)
          .filter((a) => Number(a.sold) < Number(a.size))
          .sort((a, b) => Number(a.price) - Number(b.price));
        const when = new Date(ev.eventTime).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        return (
          <article className="event-card" key={ev.eventId}>
            <div
              className="cover"
              style={{
                background: `linear-gradient(135deg, hsl(${h1} 70% 38%), hsl(${h2} 80% 22%))`,
              }}
            >
              <div className="cover-text">
                <h2>{ev.name}</h2>
                <span>{when}</span>
              </div>
            </div>
            <div className="levels">
              {levels.length === 0 && (
                <div className="empty small">Sold out — watch for resale offers.</div>
              )}
              {levels.map((a) => {
                const left = Number(a.size) - Number(a.sold);
                const pct = (Number(a.sold) / Number(a.size)) * 100;
                const key = `${ev.eventId}/${a.tierId}/${a.serialBase}`;
                return (
                  <div className="level" key={key}>
                    <div className="level-info">
                      <div>
                        <span className={`tier ${a.tierId.toLowerCase()}`}>{a.tierId}</span>
                        <span className="price">{fmtMoney(a.price)}</span>
                      </div>
                      <div className="avail">
                        <div className="avail-bar">
                          <div className="avail-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="muted small">{left} left at this price</span>
                      </div>
                    </div>
                    <button
                      className="buy"
                      disabled={busy !== null}
                      onClick={() => buy(ev.eventId, ev.name, a.tierId, Number(a.price), key)}
                    >
                      {busy === key ? "…" : "Buy"}
                    </button>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
