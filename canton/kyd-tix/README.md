# KYD Labs on Canton — TICKS + TIX rebuild (DAML)

A from-scratch rebuild of KYD Labs' on-chain ticketing and financing stack,
migrated from **Solana** to **Canton / DAML**. This package models the two
things KYD actually runs today:

1. **TICKS** — tickets as real-world assets (RWAs) with built-in anti-scalping
   price caps and artist royalties, settled atomically against cash.
2. **TIX** — the DeFi financing layer where a venue raises upfront capital
   against future ticket revenue and a lender is repaid as sales settle.

It builds and all 12 test scenarios pass on Daml SDK **2.10.4**.

```
daml build      # compiles to .daml/dist/kyd-tix-0.1.0.dar
daml test       # runs the Daml Script suite in Kyd/Test.daml
daml start       # boots a sandbox ledger + Navigator to click through it
```

---

## What KYD Labs runs on Solana (research)

KYD Labs is the largest on-chain ticketing company — clients include Robert
Plant, Charli XCX and Travis Scott, ~150k fans/month. The important finding for
a migration is that **they already abandoned NFT ticketing**:

- **Old model:** tickets were Solana **compressed NFTs (cNFTs)**. NFT-era
  anti-scalping and royalty enforcement proved easy to bypass and addressed the
  wrong economic problem.
- **Current model — TICKS:** tickets are **programmable financial primitives /
  RWAs**, not collectibles. All existing tickets were migrated off cNFTs onto
  the TICKS standard.
- **TIX:** an on-chain **settlement + financing layer**. Venues/artists borrow
  against future ticket sales; DeFi lenders fund and earn yield; smart-contract
  settlement is near-instant. ~$8M ticket sales and ~$2M venue financing so far;
  Solana mainnet launch targeted mid-2026.

Core operational mechanics carried over: primary sale, **resale price caps** and
**royalties**, retained fan data / resale controls for the artist, and door
redemption.

### How the financing leg actually works (research behind `Kyd.Tix`)

- **TIX's mechanic is revenue-routed repayment**: "ticket revenue automatically
  enforces repayment of financing", raised from *multiple liquidity providers
  without exclusivity deals". Track record: 300k+ tickets, $10M+ sales, $2M+
  venue financing, zero defaults.
- **Live-event capital is revenue-based financing (RBF), not a compound-interest
  loan**: a one-time **factor rate** (typically 1.10x–1.50x) fixes the total
  repayment up front; a **revenue share** of each sale (commonly 2–15% of gross;
  much higher when secured against a single show) pays it down until the cap is
  hit. Interest only enters as a *late penalty* past maturity.
- **Syndication on DAML is production-proven**: Versana — founded by BofA, Citi,
  Credit Suisse and J.P. Morgan — runs syndicated loans on Daml/Canton (1,500+
  loans, ~$900B). Distributions follow a single **pro-rata waterfall**: every
  lender is paid simultaneously, proportional to its share.

Sources:
- [KYD Labs TICKS Protocol — Solana Compass](https://solanacompass.com/learn/breakpoint-25/nft-ticketing-doesnt-work-and-were-selling-to-ticketmaster-kyd-labs)
- [TIX emerges from stealth — Cointelegraph](https://cointelegraph.com/news/tix-defi-onchain-settlement-live-event-ticketing)
- [KYD Labs launches TIX — The Defiant](https://thedefiant.io/news/nfts-and-web3/solana-ticketing-platform-kyd-labs-launches-tix)
- [Founders launch TIX — TicketNews](https://www.ticketnews.com/2025/12/founders-kyd-labs-launch-tix/)
- [KYD Labs launches decentralised financing network — Music Ally](https://musically.com/2025/12/12/kyd-labs-launches-decentralised-financing-network-for-live-events/)
- [TIX Protocol launches Solana-based financing network — Yellow](https://yellow.com/news/tix-protocol-launches-solana-based-financing-network-for-live-events-industry)
- [Revenue-based financing: terms & mechanics — re:cap](https://www.re-cap.com/financing-instruments/revenue-based-financing)
- [How RBF repayment works — Crestmont Capital](https://www.crestmontcapital.com/blog/how-revenue-based-financing-repayment-works)
- [Versana: syndicated loans on Daml/Canton — Ledger Insights](https://www.ledgerinsights.com/syndicated-loans-smart-contracts/)

---

## Why Canton/DAML is the right target

The reasons KYD's NFT enforcement leaked on Solana are exactly what Canton fixes
at the protocol level, rather than in front-end conventions:

| KYD requirement | Solana / NFT reality | Canton / DAML primitive |
| --- | --- | --- |
| Resale price cap can't be bypassed | Marketplace can ignore on-chain metadata; OTC transfers route around royalties | Transfer is a **`choice` on the asset** — the cap is a precondition; there is no "raw transfer" instruction to bypass |
| Royalty always paid | Royalties are honored only by cooperating marketplaces | Royalty split is part of the **same atomic transaction** as the ownership change (DvP) — no settlement, no transfer |
| Fan data / resale control stays with the artist | Public ledger; anyone can index holders | **Sub-transaction privacy**: a fan is `observer` only of their own ticket; one venue never sees another's events |
| Venue financing on real cash flows | Needs a separate lending protocol + oracle | `FinancingRequest` → `Loan` are signed contracts whose cash legs are atomic and visible to exactly the 3 counterparties |
| No oversell | Mint guarded by program logic | Authoritative `issued` counter on the `Event`; `ensure` clause makes oversell unrepresentable |

DAML patterns used: **propose/accept** (onboarding, resale), **lock-by-archiving**
(a listed ticket can't be double-offered), **atomic DvP**, **contract keys**
(unique `(operator, eventId, serial)`), and **signatory/observer privacy**.

---

## Contract model

| Module | Templates | Solana equivalent |
| --- | --- | --- |
| `Kyd.Roles` | `Invitation`, `Membership` | PDAs / signer allow-lists |
| `Kyd.Cash` | `Cash` | USDC SPL token (here: operator IOU, for atomic settlement + escrow disclosure) |
| `Kyd.Event` | `Event` (tiered), `PurchaseOrder` | Event/collection program + mint authority + the sales engine |
| `Kyd.Ticket` | `Ticket`, `ResaleOffer` | The TICKS asset + marketplace listing |
| `Kyd.Tix` | `FinancingOffering`, `OpenFinancingOffering`, `SyndicatedLoan`, `TrancheOffer` | The TIX financing/settlement program: invited + open-book raises, tranche secondary market |

### Lifecycle

```
operator --Invitation--> venue/artist/fan/lender        (onboarding)
venue+artist+operator: create Event                      (primary issuance authority)
Event.Event_Issue(tier) ----> Ticket (owner = fan)       (comps/door sales, issued++)
fan: PurchaseOrder(tier) --Fill(operator)-->             (paid primary sale, atomic:)
    payment == tier's current dynamic price
    payment -> venue
    revenue share -> lenders via the active loan         (unbypassable routing)
    Ticket -> fan  [resale cap = paid price x capBps]
Event_SetTierBasePrice (venue or artist)                 (manual dynamic pricing)
Ticket.Ticket_Offer --> ResaleOffer  [price <= cap]      (locks the ticket)
ResaleOffer.Accept(cash):                                (atomic DvP)
    royalty  -> artist
    proceeds -> seller
    ticket   -> buyer
Ticket.Ticket_CheckIn -> redeemed (resale now blocked)   (door scan)

venue+operator: FinancingOffering (invited lenders)      (TIX: targeted raise)
              | OpenFinancingOffering (observer: public)  (TIX: open order book)
Offering_Commit(cash) per lender --> escrow w/ operator  (lock-by-safekeeping)
  open book: any lender holding a Lender membership       (KYC gate, no invite)
             reads `public` to discover and commit
  Offering_Uncommit / Offering_Cancel --> refunds        (escape hatches)
Offering_Activate [fully subscribed]:                    (atomic)
    principal -> venue
    SyndicatedLoan booked; tranche_i = commit_i x factor rate
Loan_SettleRevenue(sale cash):                           (auto-enforced repayment)
    revenue share --> lenders pro-rata; remainder -> venue
Loan_Distribute(cash) --> pro-rata waterfall             (direct paydown)
Loan_AccrueLateInterest [past dueDate]                   (simple interest / late day)
... archived when every tranche reaches zero

lender: Loan_OfferTranche --> TrancheOffer               (secondary market listing)
TrancheOffer_Accept(cash) [buyer + operator]:            (atomic DvP, KYC-gated)
    price -> seller; register: face moves seller -> buyer
```

The paid primary sale is the piece that makes TIX's *"ticket revenue
automatically enforces repayment"* literal on Canton: issuance, payment and
loan settlement are one transaction, so the venue cannot receive primary
revenue without the lenders' share being carved out first. The tranche market
clears through the operator (joint controller), mirroring the agent-bank role
in real syndications, and buyers must hold a `Lender` membership — an on-ledger
KYC gate for the RWA story.

### Targeted vs. open financing (the public-party pattern)

A contract is only visible to its stakeholders, so an *open* raise needs a way
for unknown lenders to discover it. `OpenFinancingOffering` is observed by a
well-known **`public`** party that every onboarded lender reads (`readAs`),
forming a public order book — the standard Canton broadcast pattern. Eligibility
moves from an invite list to **on-ledger credentials**: `OpenOffering_Commit`
looks up the committer's `Lender` membership (`Kyd.Roles`) as a KYC gate, so
anyone with a credential can fund and nobody else can. Both paths converge on
the same `SyndicatedLoan`, so settlement, the waterfall and the tranche market
are identical downstream.

### TIX worked example (from `testSyndicatedFinancing`)

Target 1,000 at a **1.10x factor rate**, **50% revenue share**, 10bps/day late
interest. Lender A commits 600, lender B 400 (escrowed; refundable until
activation). On activation the venue receives 1,000 and owes A 660 / B 440.
A 200 ticket sale settles through the loan: 100 is carved out pro-rata
(A 60 / B 40) before the venue touches the rest. A direct 500 paydown splits
A 300 / B 200. Ten days past maturity, outstanding accrues 1% (A 303 / B 202),
and a final 505 payment retires the loan — every leg atomic, every split exact.

### Tiered seating + dynamic pricing

Events are organised into tiers (GA / VIP / …), each with its own supply,
base price and resale-cap policy. Two anti-scalping levers from KYD's playbook
are encoded as contract law:

- **On-ledger demand curve**: each sale in a tier escalates its price by
  `demandBps` of base (deterministic and auditable — no oracle). The
  operator's fill rejects payments at any other price, so a fan is never
  charged a price they didn't sign for, and bots can't bulk-buy at a stale
  price. The venue or the artist can also reprice a tier manually.
- **Resale cap anchored to the price actually paid** (`resaleCapBps` x
  purchase price), not one event-wide number — a fan who paid 51 on the curve
  can resell at up to 76.5 (1.5x), and not a cent more.

### Worked example (from `testResaleWithRoyalty`)

Face 50, resale cap 75, royalty 10%. Alice resells to Bob at **70**:
royalty **7 → artist**, **63 → Alice**, ticket **→ Bob** — one transaction, all
or nothing. An offer at 100 is rejected by the cap (`testResaleCapEnforced`); a
checked-in ticket can't be resold (`testRedeemedCannotResell`).

---

## Tests

`daml test` runs:

1. `testOnboarding` — propose/accept membership handshake
2. `testPrimarySale` — mint to fan, issued-counter advances
3. `testResaleWithRoyalty` — atomic royalty + proceeds + ownership
4. `testResaleCapEnforced` — anti-scalping cap rejects over-cap offers
5. `testRedeemedCannotResell` — redeemed tickets are non-transferable
6. `testSyndicatedFinancing` — two-lender raise: escrowed commitments, guards
   (uninvited / double / over-commit, premature activation), atomic activation,
   revenue-share settlement, pro-rata distribution, late-interest accrual,
   full payoff
7. `testOfferingCancelAndUncommit` — lender withdrawal and venue cancellation
   both refund escrow in full
8. `testPaidPrimarySaleRoutesRevenue` — a fan's purchase order fills atomically:
   payment, loan revenue-share carve-out and ticket mint in one transaction;
   underpayment cannot fill
9. `testTrancheSecondaryTrading` — tranche sold at a discount via atomic DvP;
   over-listing and non-KYC'd buyers rejected; the buyer participates pro-rata
   in subsequent distributions
10. `testTieredDynamicPricing` — GA climbs 50 → 51 → 52 on the demand curve
    (stale prices rejected) while VIP stays flat; per-purchase resale caps;
    independent tier sell-out; artist repricing; unauthorized repricing
    rejected
11. `testOpenOrderBook` — non-invited raise broadcast to the public party;
    onboarded lenders discover and commit via `readAs public`; non-onboarded
    party rejected at the KYC gate; converts to the same syndicated loan

---

## Not in scope (next steps)

- Daml Triggers to auto-fill purchase orders and run late-interest accrual.
- A `daml2js` codegen front-end + JSON API for the existing KYD web app.
