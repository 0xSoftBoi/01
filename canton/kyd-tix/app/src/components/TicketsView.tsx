// My Tickets: the QR is the product. Each ticket renders as a pass with its
// scan code (the contract id — unforgeable, revocable, exactly one valid copy
// on the ledger). Resale lives behind the pass with the anti-scalping cap
// surfaced as a hard limit in the UI — and enforced again on-ledger.
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type Ledger from "@daml/ledger";
import { Ticket, ResaleOffer } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";
import { exactNote, fmtMoney, shortParty, useQuery } from "../api";

interface Props {
  fanLedger: Ledger;
  fan: string;
  otherFans: { party: string; label: string }[];
}

export default function TicketsView({ fanLedger, fan, otherFans }: Props) {
  const tickets = useQuery(fanLedger, Ticket);
  const offers = useQuery(fanLedger, ResaleOffer);
  const [selling, setSelling] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [buyerParty, setBuyerParty] = useState(otherFans[0]?.party ?? "");
  const [error, setError] = useState<string | null>(null);

  const mine = tickets.contracts.filter((t) => t.payload.owner === fan);
  const incoming = offers.contracts.filter((o) => o.payload.buyer === fan);
  const outgoing = offers.contracts.filter((o) => o.payload.ticket.owner === fan);

  const listForResale = async (ticketCid: string) => {
    setError(null);
    try {
      await fanLedger.exercise(Ticket.Ticket_Offer, ticketCid as never, {
        buyer: buyerParty,
        salePrice: Number(price).toFixed(10),
      });
      setSelling(null);
      setPrice("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const acceptOffer = async (offerCid: string, salePrice: string) => {
    setError(null);
    try {
      const cashCid = await exactNote(fanLedger, fan, Number(salePrice));
      await fanLedger.exercise(ResaleOffer.ResaleOffer_Accept, offerCid as never, { cashCid });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="stack">
      {error && <div className="banner error">{error}</div>}

      {incoming.length > 0 && (
        <div className="card">
          <h3>Offered to you</h3>
          {incoming.map((o) => (
            <div className="level" key={o.contractId}>
              <div>
                <strong>
                  {o.payload.ticket.eventId} · {o.payload.ticket.tierId} #{o.payload.ticket.serial}
                </strong>
                <span className="muted"> from {shortParty(o.payload.ticket.owner)} · </span>
                <span className="price">{fmtMoney(o.payload.salePrice)}</span>
              </div>
              <div className="row">
                <button onClick={() => acceptOffer(o.contractId, o.payload.salePrice)}>Accept</button>
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

      {mine.length === 0 && incoming.length === 0 && (
        <p className="muted">No tickets yet — grab one under Discover.</p>
      )}

      <div className="passes">
        {mine.map((t) => (
          <div className="pass" key={t.contractId}>
            <div className="pass-head">
              <div>
                <h3>{t.payload.eventId}</h3>
                <span className="tier">{t.payload.tierId}</span> <span>#{t.payload.serial}</span>
              </div>
              {t.payload.redeemed && <span className="badge">USED</span>}
            </div>
            <div className="qr">
              <QRCodeSVG value={t.contractId} size={132} bgColor="#ffffff" fgColor="#0b0b0c" />
            </div>
            <div className="pass-foot">
              <span className="muted">
                Paid {fmtMoney(t.payload.facePrice)} · resale capped at{" "}
                {fmtMoney(t.payload.maxResalePrice)}
              </span>
              {!t.payload.redeemed &&
                (selling === t.contractId ? (
                  <div className="sell-form">
                    <select value={buyerParty} onChange={(e) => setBuyerParty(e.target.value)}>
                      {otherFans.map((f) => (
                        <option key={f.party} value={f.party}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder={`max ${Number(t.payload.maxResalePrice).toFixed(2)}`}
                      max={Number(t.payload.maxResalePrice)}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <button
                      disabled={!price || Number(price) > Number(t.payload.maxResalePrice)}
                      onClick={() => listForResale(t.contractId)}
                    >
                      Send offer
                    </button>
                    <button className="ghost" onClick={() => setSelling(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="ghost" onClick={() => setSelling(t.contractId)}>
                    Transfer / sell
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {outgoing.length > 0 && (
        <div className="card">
          <h3>Your open offers</h3>
          {outgoing.map((o) => (
            <div className="level" key={o.contractId}>
              <div>
                <strong>
                  {o.payload.ticket.eventId} #{o.payload.ticket.serial}
                </strong>
                <span className="muted"> to {shortParty(o.payload.buyer)} · </span>
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
