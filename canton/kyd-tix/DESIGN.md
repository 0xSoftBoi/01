# Design decisions & open questions

A decision record for the KYD-on-Canton rebuild: what was chosen, *why* against
Daml/Canton best practice, the alternatives considered, and the questions only
KYD's protocol team can answer. Read this alongside [AUDIT.md](AUDIT.md) (trust
model + findings) and [HANDOFF.md](HANDOFF.md) (what's verified vs scaffolded).

Each decision is framed so a reviewer can push on it — that's the point.

---

## D1 — Asset model: build to the CIP-56 token standard, not Daml Finance

**Decision.** `Kyd.Cash` implements the Splice **CIP-56 token-standard**
interfaces (`Holding`, plus `TransferFactory`/`AllocationFactory`/`Allocation`
in `Kyd.Registry`) directly, rather than modelling the asset with the
**Daml Finance** library.

**Why.** CIP-56 is Canton's interop layer — [the standard Canton Coin, USDCx
and every major Canton asset implement](https://www.canton.network/blog/what-is-cip-56-a-guide-to-cantons-token-standard),
and the one surface ecosystem wallets discover. For a payment/settlement asset
that must compose with those, building to the standard interfaces *is* the
idiomatic choice and makes the production swap a dependency change.
[Daml Finance](https://docs.daml.com/daml-finance/overview/intro.html) is the
heavier library for **custodial hierarchies, instrument lifecycling and exotic
contracts** — power the ticketing rail doesn't need, and orthogonal to CIP-56
(Daml Finance holdings can themselves expose the token-standard interfaces).

**Alternatives.** (a) Daml Finance `Holding`/`Account`/`Instrument` for Cash —
more machinery than a settlement IOU warrants, and still needs the CIP-56
interfaces for wallet interop. (b) A bespoke non-standard token — loses wallet
discovery and the Canton Coin/USDCx swap.

**Open question for KYD.** Does the TIX **loan/instrument** side use Daml
Finance internally (lifecycling, corporate-action-style events on the
facility)? If so, `SyndicatedLoan` should be expressed as a Daml Finance
instrument rather than a bespoke template — a clean refactor, but only worth it
if it lines up with your existing stack.

---

## D2 — Contention: cold master / hot shards, create-only receipts, batch sweep

**Decision.** Issuance splits a cold `Event` master (tier policy, touched only
by admin ops) from hot `TierAllocation` shards (one consuming choice stream
each); paid sales write **create-only** `RevenueShare` receipts; a trigger
**batch-sweeps** receipts through the loan.

**Why.** On Canton only one consuming choice lands per contract per
transaction; a contract on a high-frequency path serializes that path and
causes retry storms — the [documented contention
anti-pattern](https://docs.daml.com/canton/usermanual/contract_keys.html) ("you
cannot rely on a hot contract / shared counter"). Sharding gives N parallel
sale streams; create-only receipts never contend; the loan stays cold.

**Alternatives.** One `Event` consumed per sale (simple, but serializes an
entire on-sale); settle each sale through the loan directly (couples sales
latency to the facility and serializes on the loan).

**Open question for KYD.** What's a realistic **peak on-sale rate** (sales/sec
for a hot drop)? It sets the default shard size and how aggressively the
sales engine should pre-open shards.

---

## D3 — Contract keys only on cold contracts; key-free hot path

**Decision.** Keys exist on `Event`, `Membership`, and the loan-by-event
lookup. The sales hot path (`TierAllocation`, `Ticket`, `PurchaseOrder`) is
key-free; ticket serial uniqueness holds by construction (disjoint shard
ranges).

**Why.** [Canton cannot enforce key uniqueness across synchronizer
domains](https://docs.daml.com/canton/usermanual/contract_keys.html), and key
lookups add maintainer coordination on the hottest templates. Keeping keys to
cold admin contracts avoids both.

**Open question for KYD.** Will events/tickets ever live on **more than one
synchronizer domain** (e.g. a venue domain + a financing domain)? If yes, the
no-cross-domain-keys constraint is load-bearing and we should document the
domain assignment explicitly.

---

## D4 — Custody: lock-in-place, the Amulet model (audit KYD-02)

**Decision.** Every reservation — resale allocations, loan commitments,
revenue shares — **locks the holder's own `Cash` in place** (owner unchanged,
registry holds the lock) rather than transferring custody to the operator.

**Why.** It's how Canton Coin's Amulet reserves assets, and it means no pending
funds ever sit in operator custody (the original KYD-02 risk). Custody never
leaves the holder; the lock just makes the holding unspendable until settle or
release.

**Expiry safety valve (implemented).** Lock-in-place would let a stuck operator
freeze funds forever, so locks are **expirable**: allocations expire at
`settleBefore`, commitments at the offering's `dueDate`, and
`Cash_UnlockExpired` lets the holder reclaim unilaterally past expiry (CIP-56's
expired-lock guidance; `testCommitmentExpiryReclaim`).

**Open question for KYD.** Expiry horizon for **revenue-share** locks — they
currently have no deadline (no natural per-sale maturity); should they expire at
the event date, and what's the right grace period before a venue can reclaim an
un-swept share?

---

## D5 — Authorization: declarative, propose/accept, agent delegation

**Decision.** All authority is `signatory`/`controller` (no in-body permission
checks). Bilateral flows are propose/accept (`Invitation`, `ResaleOffer`,
`GiftOffer`, `FinancingOffering`). The artist's `RoyaltyAccount` delegates
receiver-side authority so royalty legs settle without the artist signing each
resale. Market clears (tranche trades, DvP) use the operator as a **joint
controller** — the agent-bank role.

**Why.** Matches the [Daml authorization
pattern](https://docs.daml.com/daml/patterns/authorization.html): RBAC via
signatory/observer, consent via propose/accept, one-off authority via a
delegation contract the grantor signs once.

**Open question for KYD.** Is **operator-as-agent** on market clears acceptable
to your trust model, or should venues/artists self-custody settlement
authority (removing the operator from the controller set, at the cost of more
interactive signing)?

---

## D6 — Privacy: signatory/observer scoping + public-party broadcast

**Decision.** Visibility is scoped per stakeholder (a fan sees only their
tickets; a lender only their syndicate). Discovery of otherwise-private
contracts (the catalog, the open financing book) uses a well-known **public
party** observer. No divulgence anywhere (the suite is warning-free).

**Why.** [The recommended pattern is separation by
scope](https://docs.digitalasset.com/build/3.4/sdlc-howtos/system-design/daml-app-arch-design.html);
divulgence is deprecated and breaks pruning. The public-party broadcast is the
standard way to make data discoverable without widening business-contract
observers.

**Open question for KYD.** Who hosts fan parties — KYD's validator (hosted
wallets, the demo model) or fans' own participants? And what exactly may the
**artist** see about fans (the model makes the artist an `Event` signatory, so
they see ticket holders — is that your intended data-ownership posture)?

---

## D7 — Upgrades: SCU at LF 1.17, interfaces in a separate package

**Decision.** Built at LF 1.17 with `daml-script-lts`; CIP-56 interfaces are a
**separate package** from the implementing `kyd-tix` package.

**Why.** [Smart Contract Upgrade](https://docs.daml.com/upgrade/smart-contract-upgrades.html)
needs LF 1.17 + protocol 7 and append-only (Optional) schema changes; the SCU
checker itself rejects co-packaging interfaces with implementations (we hit
this — it's why the package is split).

**Open question for KYD.** Your **package governance** — who signs/vets DAR
upgrades, and do you want the model versioned per-event (so in-flight events
keep their terms) or globally?

---

## D8 — Financing: revenue-based, factor-rate, pro-rata waterfall

**Decision.** TIX is modelled as **revenue-based financing**: a one-time factor
rate fixes total repayment, a revenue share of each sale pays it down, late
interest only accrues past maturity; syndicate distributions use a single exact
pro-rata waterfall (rounding dust to the last tranche).

**Why.** This matches how live-event/RBF capital actually prices and how
[syndicated credit settles on Daml](https://www.ledgerinsights.com/syndicated-loans-smart-contracts/)
(Versana). But — see the open question — these mechanics are **my research
assumption, not your spec.**

**Open question for KYD (highest priority).** What are TIX's **actual**
mechanics? Factor rate vs APR; revenue-share %; how the share is computed
(gross vs net, per-tier?); waterfall seniority (is it strictly pro-rata, or are
there senior/junior tranches?); default/clawback handling. Every one of these
is a one-choice change once I know the real numbers — I built the shape, you
own the terms.

---

## D9 — Dynamic pricing: on-ledger step curve per allocation

**Decision.** Demand pricing is a deterministic step function — each successive
shard of a tier prices `base × (1 + allocated × demandBps/10⁴)`. No oracle, no
shared counter.

**Why.** Auditable and contention-free (a global per-ticket curve would be the
shared-counter anti-pattern). Matches real "level 1 / level 2" on-sale pricing.

**Open question for KYD.** Do you want **continuous** dynamic pricing (per
ticket, off-ledger pricing engine signing each price) or is the per-allocation
step curve sufficient? The former is a small change (operator signs the price
into the fill) but moves pricing trust off-ledger.

---

## D10 — Settlement timing: batch sweep (throughput over immediacy)

**Decision.** Lender revenue reaches the syndicate on the sweep cadence
(minutes), not per sale.

**Why.** Keeps the loan cold under load (D2). The venue can never touch the
locked share in the interim, so the delay is liquidity timing, not credit risk
(AUDIT KYD-03).

**Open question for KYD.** Acceptable sweep cadence / SLA for lenders, and
whether large sales should settle **immediately** (a per-sale fast path
alongside the batch path).

---

## Honest limitations (don't oversell these)

- **Multi-participant privacy is proven** on a real 2-participant + 1-domain
  Canton network (`privacy-proof/`, `./run.sh`): a p1-only contract is provably
  absent from a live p2 node, with a race-free Daml Script (3 deterministic
  passes). Not yet *throughput*-benchmarked across participants.
- **Vendored package ids.** Built against vendored CIP-56 interfaces, not the
  official `splice-api-token-*-v1` releases — interface-compatible, but package
  ids differ until the swap.
- **`Kyd.Cash` is a stand-in** operator IOU; the production instrument is
  Canton Coin / USDCx (the swap is a `Kyd.Registry` dependency change).
- **iOS app is source-complete but not CI-compiled** (no macOS leg).
- **TIX mechanics are an assumption** (D8) until validated against KYD's spec.

## The five questions to leave the meeting with answers to

1. TIX's real financing mechanics (D8).
2. Settlement instrument: Canton Coin, USDCx, or KYD's own stablecoin (D1/D4).
3. Party hosting + artist data posture (D6).
4. Daml Finance for the instrument/loan side, yes or no (D1).
5. Operator-as-agent trust model on market clears (D5).
