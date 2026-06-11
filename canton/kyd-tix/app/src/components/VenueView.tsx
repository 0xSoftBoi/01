// The venue dashboard: sales by price level, inventory control (open the
// next shard on the demand curve), and the TIX facility — outstanding
// register, pending revenue-share escrows, all live from the ledger.
import type Ledger from "@daml/ledger";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { SyndicatedLoan } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Tix";
import { RevenueShare } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Settlement";
import { fmtMoney, shortParty, useQuery } from "../api";

export default function VenueView({ venueLedger, venue }: { venueLedger: Ledger; venue: string }) {
  const events = useQuery(venueLedger, Event);
  const allocs = useQuery(venueLedger, TierAllocation);
  const loans = useQuery(venueLedger, SyndicatedLoan);
  const receipts = useQuery(venueLedger, RevenueShare);

  const openShard = (eventCid: string, tierId: string) =>
    venueLedger.exercise(Event.Event_OpenAllocation, eventCid as never, { tierId, size: "5" });

  return (
    <div className="stack">
      {events.contracts.map((ev) => {
        const eventAllocs = allocs.contracts
          .map((a) => a.payload)
          .filter((a) => a.eventId === ev.payload.eventId);
        const pending = receipts.contracts
          .map((r) => r.payload)
          .filter((r) => r.eventId === ev.payload.eventId);
        const pendingSum = pending.reduce((acc, r) => acc + Number(r.amount), 0);
        const loan = loans.contracts.find((l) => l.payload.eventId === ev.payload.eventId);
        return (
          <div className="card" key={ev.payload.eventId}>
            <h3>{ev.payload.name}</h3>
            <table>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Allocated / supply</th>
                  <th>Next level price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ev.payload.tiers.map((t) => {
                  const nextPrice =
                    Number(t.basePrice) *
                    (1 + (Number(t.allocated) * Number(t.demandBps)) / 10000);
                  return (
                    <tr key={t.tierId}>
                      <td>
                        <span className="tier">{t.tierId}</span>
                      </td>
                      <td>
                        {t.allocated} / {t.supply}
                      </td>
                      <td>{fmtMoney(nextPrice)}</td>
                      <td>
                        <button
                          className="ghost"
                          disabled={Number(t.allocated) + 5 > Number(t.supply)}
                          onClick={() => openShard(ev.contractId, t.tierId)}
                        >
                          Open 5 more
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <h4>Live price levels</h4>
            {eventAllocs.length === 0 && <p className="muted">No open allocations.</p>}
            {eventAllocs
              .sort((a, b) => Number(a.serialBase) - Number(b.serialBase))
              .map((a) => (
                <div className="level" key={`${a.tierId}-${a.serialBase}`}>
                  <div>
                    <span className="tier">{a.tierId}</span>
                    <span className="price">{fmtMoney(a.price)}</span>
                    <span className="muted">
                      {" "}
                      · serials {a.serialBase}–{Number(a.serialBase) + Number(a.size) - 1}
                    </span>
                  </div>
                  <span className="muted">
                    {a.sold} / {a.size} sold
                  </span>
                </div>
              ))}
            {(loan || pending.length > 0) && (
              <>
                <h4>TIX financing</h4>
                {loan && (
                  <table>
                    <thead>
                      <tr>
                        <th>Lender</th>
                        <th>Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loan.payload.tranches.map((tr) => (
                        <tr key={tr.lender}>
                          <td>{shortParty(tr.lender)}</td>
                          <td>{fmtMoney(tr.outstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="muted">
                  {pending.length} revenue-share receipt{pending.length === 1 ? "" : "s"} pending
                  sweep ({fmtMoney(pendingSum)} escrowed — the venue cannot touch this; the sweep
                  trigger settles it to the syndicate).
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
