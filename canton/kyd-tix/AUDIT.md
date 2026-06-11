# Security review — kyd-tix (TICKS + TIX on Canton)

Self-audit of the Daml model in `daml/`, written against the authorization,
privacy and contention semantics of Daml 2.10 / Canton. Every claim below is
backed by an executable adversarial scenario in `daml/Kyd/SecurityTest.daml`
(7 attack suites) or the functional suite in `daml/Kyd/Test.daml`
(15 scenarios). The full suite runs warning-free: divulgence-free by
construction, not by suppression.

## Trust model

| Party | Powers | Bounded by |
| --- | --- | --- |
| **Operator** (KYD platform) | Issues `Cash` (it is an IOU on the operator); fills purchase orders; runs sweep/accrual automation; co-signs tranche trades and receipt refunds | Cannot move owner-held cash, comp-issue tickets, reprice, rewrite the lender register (KYD-01), or refund escrow unilaterally |
| **Venue** | Opens allocations, comps, repricing, raises financing, distributes repayments | Cannot self-fill paid orders, touch the carved-out financing share, or refund escrow unilaterally |
| **Artist** | Co-signs events; repricing; receives royalties | Cannot issue, spend, or alter financing |
| **Fan** | Signs purchase orders (authorizing exactly one payment); owns tickets | Resale gated by price cap; redeemed tickets non-transferable |
| **Lender** | Commits/uncommits to raises; trades tranches; receives waterfall payments | KYC-gated (membership); cannot touch tickets, events, or other lenders' positions |

## Findings

### KYD-01 — Operator could unilaterally rewrite the lender register (HIGH, fixed)

`Loan_ExecuteTrancheTransfer` had `controller operator`. Since the operator is
a loan signatory, it could move any lender's tranche to any party with no
offer and no payment. The only legitimate call site (`TrancheOffer_Accept`)
already carries the seller's authority via the offer the seller signed, so the
choice now requires `controller operator, seller` — the capability is removed
at zero cost to the workflow.
Verified by `testRegisterIntegrity`.

### KYD-02 — Escrow custody equals issuer risk (MEDIUM, acknowledged)

Pending revenue shares and financing commitments are held as operator-owned
`Cash`. A malicious operator could archive a `RevenueShare` via
`Receipt_Release` and keep the note. However, **all** `Kyd.Cash` is already a
liability of the operator (the issuer), so escrow custody adds no risk class
beyond the issuer risk every holder already bears; the signed receipt is the
venue's and lenders' auditable claim. Production mitigation: replace
`Kyd.Cash` with Canton Coin / CIP-56 token-standard holdings and hold escrows
as **locked holdings**, moving custody from the app operator to the
instrument's own registry (see `validator/README.md`).
Partially verified by `testReceiptCustody` (no party other than the operator
can release; refund requires operator AND venue).
**Mitigation progress:** the resale rail already settles via CIP-56
`Allocation`s (`Kyd.Ticket:DvPResaleOffer`, tested through the standard
interface in `Kyd.TokenTest`), where escrow custody sits with the asset's own
registry, not the app operator. Extending the same rail to financing
commitments and revenue-share escrows retires this finding fully.

### KYD-03 — Batch settlement delays lender receipt (LOW, by design)

Receipts reach lenders on the sweep cadence (minutes), not per sale. This is
the deliberate contention trade (one loan write per batch instead of per
ticket; see README "Canton engineering"). The venue can never touch the share
in the interim, so the delay is liquidity timing, not credit risk.
Verified by `testBatchSweep` and `testPaidPrimarySaleRoutesRevenue`.

### KYD-04 — Refunded escrow retains disclosure (INFO, acknowledged)

`Offering_Cancel` refunds lender escrows without clearing the `Cash`
disclosure list (the venue remains an observer of the refunded note until the
lender re-discloses or transfers). `Offering_Uncommit` and activation DO clear
it. Impact: transient read-only visibility of one note's balance; the owner
can clear it at will via `Cash_Disclose []`.

### KYD-05 — Step-pricing granularity is venue-controlled (INFO)

The demand curve advances per allocation, not per ticket. A venue opening one
huge shard flattens the curve for that block. This is a policy knob (shard
size), not a vulnerability — the curve parameters themselves are tamper-proof
(signed by operator+venue+artist on the master).

### KYD-06 — Divulgence eliminated (resolved during development)

Early escrow flows relied on contract divulgence (deprecated on Canton,
incompatible with pruning). All escrow visibility is now explicit via the
`Cash.observers` disclosure list; the suite runs with zero divulgence
warnings.

## Attack coverage (`daml/Kyd/SecurityTest.daml`)

| Suite | Attacks proven impossible |
| --- | --- |
| `testCashSecurity` | Forged issuance; third-party/operator theft of owner cash; overdraft splits; cross-owner merges |
| `testIssuanceAuthorization` | Non-venue allocation opening; operator comp-minting; operator repricing; venue self-filling paid orders |
| `testReceiptCustody` | Unilateral refund by venue or operator; venue exercising release |
| `testRegisterIntegrity` | Operator rewriting the register alone (KYD-01); phantom sellers; buyer withdrawing a seller's offer; seller accepting for the buyer |
| `testForeignReceiptRejected` | Sweeping one event's receipts through another event's loan |
| `testResaleSecurity` | Double-listing a ticket; third party accepting an offer; paying with another's note or short amount; non-venue check-in; double check-in |
| `testRoleForgery` | Self-issued memberships; accepting another party's invitation |

## Residual assumptions

1. The operator runs the automation honestly and promptly (sweeps, fills,
   accrual). Failure mode is liveness, not safety: nothing settles wrongly,
   things settle late. On-ledger state remains the source of truth.
2. `Cash` is a stand-in instrument. The Canton-native deployment swaps it for
   CIP-56 token-standard holdings (Canton Coin or a stablecoin registry),
   which also retires KYD-02.
3. Ledger time is Canton's (skew-bounded); late-interest accrual quantizes to
   whole days, so clock skew cannot mint partial-day interest.
