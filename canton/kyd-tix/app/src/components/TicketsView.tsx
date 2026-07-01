// My Tickets: the pass is the product. Pending orders render as shimmering
// passes that materialize into the real QR when the operator's fill commits —
// the buy never feels like it disappeared into a queue. Resale keeps the
// anti-scalping cap as the slider's ceiling and the ledger's law.
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type Ledger from "@daml/ledger";
import { Ticket, ResaleOffer, GiftOffer } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { Event, PurchaseOrder } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { QueryResult, coverHues, exactNote, fmtMoney, shortParty, usePendingOrders, useQuery } from "../api";
import { track } from "../analytics";
import { useToast } from "../Toast";
import { LogoIcon } from "../Logo";

// Cosmetic "ticket code" printed under the QR, echoing the real ticket's
// barcode-with-digits footer — derived from the contract id, not a real
// scan target (the QR itself is that; see fgColor comment below).
function ticketCode(contractId: string): string {
  return contractId.replace(/[^0-9a-zA-Z]/g, "").slice(-20).toUpperCase();
}

interface Props {
  events: QueryResult<Event>;
  fanLedger: Ledger;
  fan: string;
  otherFans: { party: string; label: string }[];
}

export default function TicketsView({ events, fanLedger, fan, otherFans }: Props) {
  const tickets = useQuery(fanLedger, Ticket);
  const offers = useQuery(fanLedger, ResaleOffer);
  const gifts = useQuery(fanLedger, GiftOffer);
  const pending = usePendingOrders(fanLedger, fan);
  const toast = useToast();
  const [selling, setSelling] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [buyerParty, setBuyerParty] = useState(otherFans[0]?.party ?? "");

  const eventName = (eventId: string) =>
    events.contracts.find((e) => e.payload.eventId === eventId)?.payload.name ?? eventId;

  const mine = tickets.contracts.filter((t) => t.payload.owner === fan);

  // Once per My Tickets visit, after the passes have actually loaded.
  const viewTracked = useRef(false);
  useEffect(() => {
    if (tickets.loading || viewTracked.current) return;
    viewTracked.current = true;
    track("pass_viewed", { passes: mine.length });
  }, [tickets.loading, mine.length]);
  const incoming = offers.contracts.filter((o) => o.payload.buyer === fan);
  const outgoing = offers.contracts.filter((o) => o.payload.ticket.owner === fan);
  const incomingGifts = gifts.contracts.filter((g) => g.payload.recipient === fan);
  const outgoingGifts = gifts.contracts.filter((g) => g.payload.ticket.owner === fan);

  const listForResale = async (ticketCid: string) => {
    try {
      await fanLedger.exercise(Ticket.Ticket_Offer, ticketCid as never, {
        buyer: buyerParty,
        salePrice: Number(price).toFixed(10),
      });
      toast("ok", "Offer sent — they'll see it instantly");
      setSelling(null);
      setPrice("");
    } catch {
      toast("err", "Couldn't send the offer");
    }
  };

  const sendGift = async (ticketCid: string) => {
    try {
      await fanLedger.exercise(Ticket.Ticket_OfferGift, ticketCid as never, {
        recipient: buyerParty,
      });
      toast("ok", "Gift sent — they just have to accept it");
      setSelling(null);
    } catch {
      toast("err", "Couldn't send the gift");
    }
  };

  const acceptOffer = async (offerCid: string, salePrice: string) => {
    try {
      const cashCid = await exactNote(fanLedger, fan, Number(salePrice));
      await fanLedger.exercise(ResaleOffer.ResaleOffer_Accept, offerCid as never, { cashCid });
      track("offer_accepted", { salePrice: Number(salePrice) });
      toast("ok", "It's yours — ticket added to your passes");
    } catch (e) {
      toast(
        "err",
        e instanceof Error && e.message === "INSUFFICIENT_FUNDS"
          ? "Not enough balance — add funds first"
          : "Couldn't accept the offer",
      );
    }
  };

  const empty =
    mine.length === 0 && incoming.length === 0 && pending.length === 0 && incomingGifts.length === 0;

  return (
    <div className="stack">
      {incoming.length > 0 && (
        <div className="card glow">
          <h3>Offered to you</h3>
          {incoming.map((o) => (
            <div className="level" key={o.contractId}>
              <div>
                <strong>{eventName(o.payload.ticket.eventId)}</strong>
                <div className="muted small">
                  {o.payload.ticket.tierId} #{o.payload.ticket.serial} · from{" "}
                  {shortParty(o.payload.ticket.owner)} ·{" "}
                  <span className="price">{fmtMoney(o.payload.salePrice)}</span>
                </div>
              </div>
              <div className="row">
                <button onClick={() => acceptOffer(o.contractId, o.payload.salePrice)}>
                  Accept
                </button>
                <button
                  className="ghost"
                  onClick={() =>
                    fanLedger.exercise(ResaleOffer.ResaleOffer_Reject, o.contractId as never, {})
                  }
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {incomingGifts.length > 0 && (
        <div className="card glow">
          <h3>🎁 Sent to you</h3>
          {incomingGifts.map((g) => (
            <div className="level" key={g.contractId}>
              <div>
                <strong>{eventName(g.payload.ticket.eventId)}</strong>
                <div className="muted small">
                  {g.payload.ticket.tierId} #{g.payload.ticket.serial} · a gift from{" "}
                  {shortParty(g.payload.ticket.owner)}
                </div>
              </div>
              <div className="row">
                <button
                  onClick={async () => {
                    await fanLedger.exercise(GiftOffer.GiftOffer_Accept, g.contractId as never, {});
                    toast("ok", "Added to your passes");
                  }}
                >
                  Accept
                </button>
                <button
                  className="ghost"
                  onClick={() =>
                    fanLedger.exercise(GiftOffer.GiftOffer_Decline, g.contractId as never, {})
                  }
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {empty && (
        <div className="empty">
          <h3>No passes yet</h3>
          <p className="muted">Grab a ticket under Discover — it lands here instantly.</p>
        </div>
      )}

      <div className="passes">
        {pending.map((p) => (
          <div className="pass pending" key={p.contractId}>
            <div className="pass-body" style={{ paddingTop: 18 }}>
              <div>
                <p className="pass-field-label">Show:</p>
                <p className="pass-field-value">{eventName(p.payload.eventId)}</p>
                <span className="tier">{p.payload.tierId}</span>
              </div>
              <div className="qr shimmer" />
              <div className="pass-foot">
                <span className="muted small">Issuing your pass…</span>
                <button
                  className="ghost small-btn"
                  onClick={() =>
                    fanLedger.exercise(PurchaseOrder.PurchaseOrder_Cancel, p.contractId as never, {})
                  }
                >
                  Cancel order
                </button>
              </div>
            </div>
          </div>
        ))}

        {mine.map((t) => {
          const [h1, h2] = coverHues(t.payload.eventId);
          const when = new Date(t.payload.eventTime).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          return (
            <div className="pass" key={t.contractId}>
              <div
                className="pass-banner"
                style={{
                  background: `linear-gradient(135deg, hsl(${h1} 70% 45%), hsl(${h2} 80% 35%))`,
                }}
              >
                <span className="pass-banner-logo">
                  <LogoIcon size={12} />
                  kyd labs
                </span>
              </div>
              <div className="pass-torn" />
              <div className="pass-body">
                <div>
                  <p className="pass-field-label">Show:</p>
                  <p className="pass-field-value">{eventName(t.payload.eventId)}</p>
                </div>
                <div>
                  <p className="pass-field-label">Date</p>
                  <p className="pass-field-value">{when}</p>
                </div>
                <div>
                  <p className="pass-field-label">Tier</p>
                  <p className="pass-field-value">
                    {t.payload.tierId} · #{t.payload.serial}
                  </p>
                </div>
                {t.payload.redeemed && <span className="badge used pass-status">USED</span>}
                <div className="perforation">
                  <span className="pass-sticker" />
                </div>
                <div className={`qr ${t.payload.redeemed ? "dim" : ""}`}>
                  <QRCodeSVG value={t.contractId} size={128} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <p className="pass-code">{ticketCode(t.contractId)}</p>
                <div className="pass-foot">
                  <span className="muted small">
                    Paid {fmtMoney(t.payload.facePrice)} · resale cap{" "}
                    {fmtMoney(t.payload.maxResalePrice)}
                  </span>
                  {!t.payload.redeemed &&
                    (selling === t.contractId ? (
                      <div className="sell-form">
                        <select value={buyerParty} onChange={(e) => setBuyerParty(e.target.value)}>
                          {otherFans.map((f) => (
                            <option key={f.party} value={f.party}>
                              to {f.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder={`≤ ${Number(t.payload.maxResalePrice).toFixed(2)}`}
                          max={Number(t.payload.maxResalePrice)}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                        <button
                          disabled={
                            !price || Number(price) > Number(t.payload.maxResalePrice) || Number(price) <= 0
                          }
                          onClick={() => listForResale(t.contractId)}
                        >
                          Send
                        </button>
                        <button className="ghost" onClick={() => sendGift(t.contractId)}>
                          Gift free
                        </button>
                        <button className="ghost" onClick={() => setSelling(null)}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button className="ghost small-btn" onClick={() => setSelling(t.contractId)}>
                        Transfer / sell
                      </button>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(outgoing.length > 0 || outgoingGifts.length > 0) && (
        <div className="card">
          <h3>Your open offers</h3>
          {outgoingGifts.map((g) => (
            <div className="level" key={g.contractId}>
              <div>
                <strong>{eventName(g.payload.ticket.eventId)}</strong>
                <span className="muted small">
                  {" "}
                  #{g.payload.ticket.serial} · gift to {shortParty(g.payload.recipient)}
                </span>
              </div>
              <button
                className="ghost"
                onClick={() =>
                  fanLedger.exercise(GiftOffer.GiftOffer_Withdraw, g.contractId as never, {})
                }
              >
                Withdraw
              </button>
            </div>
          ))}
          {outgoing.map((o) => (
            <div className="level" key={o.contractId}>
              <div>
                <strong>{eventName(o.payload.ticket.eventId)}</strong>
                <span className="muted small">
                  {" "}
                  #{o.payload.ticket.serial} to {shortParty(o.payload.buyer)} ·{" "}
                </span>
                <span className="price">{fmtMoney(o.payload.salePrice)}</span>
              </div>
              <button
                className="ghost"
                onClick={() =>
                  fanLedger.exercise(ResaleOffer.ResaleOffer_Withdraw, o.contractId as never, {})
                }
              >
                Withdraw
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
