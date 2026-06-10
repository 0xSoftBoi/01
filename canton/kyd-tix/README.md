# KYD Labs on Canton — TICKS + TIX rebuild (DAML)

A from-scratch rebuild of KYD Labs' on-chain ticketing and financing stack,
migrated from **Solana** to **Canton / DAML**. This package models the two
things KYD actually runs today:

1. **TICKS** — tickets as real-world assets (RWAs) with built-in anti-scalping
   price caps and artist royalties, settled atomically against cash.
2. **TIX** — the DeFi financing layer where a venue raises upfront capital
   against future ticket revenue and a lender is repaid as sales settle.

It builds and all 7 test scenarios pass on Daml SDK **2.10.4**.

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

Sources:
- [KYD Labs TICKS Protocol — Solana Compass](https://solanacompass.com/learn/breakpoint-25/nft-ticketing-doesnt-work-and-were-selling-to-ticketmaster-kyd-labs)
- [TIX emerges from stealth — Cointelegraph](https://cointelegraph.com/news/tix-defi-onchain-settlement-live-event-ticketing)
- [KYD Labs launches TIX — The Defiant](https://thedefiant.io/news/nfts-and-web3/solana-ticketing-platform-kyd-labs-launches-tix)
- [Founders launch TIX — TicketNews](https://www.ticketnews.com/2025/12/founders-kyd-labs-launch-tix/)

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
| `Kyd.Cash` | `Cash` | USDC SPL token (here: operator IOU, for atomic settlement) |
| `Kyd.Event` | `Event` | Event/collection program + mint authority |
| `Kyd.Ticket` | `Ticket`, `ResaleOffer` | The TICKS asset + marketplace listing |
| `Kyd.Tix` | `FinancingRequest`, `Loan` | The TIX financing/settlement program |

### Lifecycle

```
operator --Invitation--> venue/artist/fan/lender        (onboarding)
venue+artist+operator: create Event                      (primary issuance authority)
Event.Event_Issue ----> Ticket (owner = fan)             (primary sale, issued++)
Ticket.Ticket_Offer --> ResaleOffer  [price <= cap]      (locks the ticket)
ResaleOffer.Accept(cash):                                (atomic DvP)
    royalty  -> artist
    proceeds -> seller
    ticket   -> buyer
Ticket.Ticket_CheckIn -> redeemed (resale now blocked)   (door scan)

venue: FinancingRequest --Fund(cash)--> Loan             (TIX: capital to venue)
Loan.Loan_Repay(cash) --> repaid to lender               (TIX: settle from sales)
```

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
6. `testTixFinancing` — venue raises capital and repays the lender

---

## Not in scope (next steps)

- Interest accrual / late-payment penalties on `Loan` (model supports partial
  repayment; rate logic is a thin add-on).
- Pooled / multi-lender financing (today one `FinancingRequest` targets one lender).
- Tiered seating and dynamic pricing curves on `Event`.
- A `daml2js` codegen front-end + JSON API for the existing KYD web app.
