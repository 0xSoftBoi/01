# Running kyd-tix on the Canton Network

The Daml model in `../daml` runs on any Canton ledger. This document is the
**production network plan**: operating a validator node on the Canton Network
(Global Synchronizer), the path to **Featured Application** status, and how
the network's incentive economics (Canton Coin) turn the TIX operator from a
fee-payer into a reward earner. Sources are linked throughout; network
parameters below are as of mid-2026.

```
KYD operator party ── hosted on ──▶ KYD validator node (participant + validator app)
                                          │ connects to
                                  Global Synchronizer (BFT, run by Super Validators)
                                          │ governs
                       Canton Coin issuance, Featured App rights, traffic fees
```

## 1. Network roles, correctly distinguished

- **Participant node** — hosts parties and executes Daml (what `daml sandbox`
  emulates locally). Privacy lives here: a participant only ever sees the
  sub-transactions its parties are stakeholders of.
- **Validator node** — the Splice packaging of a participant **plus** the
  validator app, wallet and CNS (name service) apps; it connects your
  participant to the Global Synchronizer and handles Canton Coin operations.
- **Super Validator (SV)** — runs the Global Synchronizer itself (the BFT
  sequencing layer) and the Canton Coin registry (the DSO party). SVs vote on
  governance: onboarding, Featured App grants, tokenomics CIPs. SV status is
  granted by the foundation/governance, not self-service — apps like ours run
  validators and *interact with* SV-governed services.

## 2. Standing up the KYD validator

Local/dev first: `../integration/run-local.sh` (sandbox + JSON API +
triggers). Network deployment per the official
[validator onboarding](https://docs.sync.global/validator_operator/validator_onboarding.html):

1. **DevNet** — self-serve-ish; obtain an onboarding secret, deploy via
   [Docker Compose or Helm](https://docs.dev.sync.global/validator_operator/validator_helm.html),
   point the node at a DevNet scan/sequencer endpoint.
2. **TestNet** — requires prior MainNet approval by the **Tokenomics
   Committee** of the Global Synchronizer Foundation (request via
   [sync.global/validator-request](https://sync.global/validator-request/)).
3. **MainNet** — invite-only: sponsorship by an existing SV, validator, app
   provider or the foundation; your node's **egress IP is allow-listed** by
   the SVs (2–7 days to propagate); your SV sponsor issues the onboarding
   secret.

Operationally for this app: the validator hosts `KYD-Operator` (and optionally
venue parties for managed venues); fans/lenders may be hosted here too or
bring their own validators — Canton's point is that the model's
signatory/observer structure, not node topology, decides who sees what. The
three triggers (`autoFillOrders`, `sweepRevenue`, `accrueLateInterest`) run
against the validator's Ledger API exactly as against the local sandbox.

Sizing note: the shard architecture (see README "Canton engineering") is what
makes a single validator viable for on-sale spikes — load fans out across
`TierAllocation` shards; no global write bottleneck exists in the model.

## 3. Featured Application status

Per the [Canton Coin tokenomics](https://www.canton.network/blog/canton-coin-rewarding-utility)
and [featured-app activity marker docs](https://docs.global.canton.network.sync.global/background/tokenomics/feat_app_act_marker_tokenomics.html):

- Every app starts **unfeatured**: it can still mint app rewards from the
  traffic fees it actually burns, but the amount is capped.
- **Featured** status is granted by a **⅔ Super Validator vote** (requests go
  through the foundation's Featured Applications process). The grant is an
  on-ledger **`FeaturedAppRight`** contract held by the app's provider party —
  for us, `KYD-Operator`.
- A featured app earns by attaching **`FeaturedAppActivityMarker`s** to the
  transactions it provides. SV automation converts each marker into an
  **`AppRewardCoupon`** (DSO signatory, provider as observer), which the
  provider redeems for newly minted **Canton Coin** in the next minting round.

**Where kyd-tix emits activity** (the integration points, in order of value):

| App transaction | Marker attached by |
| --- | --- |
| `PurchaseOrder_Fill` (every primary sale) | the fill submission by `KYD-Operator` |
| `Loan_SweepRevenue` / `Loan_Distribute` (financing settlement) | the sweep/distribute submission |
| `TrancheOffer_Accept` (secondary market clearing) | the operator's co-signed accept |
| `ResaleOffer_Accept` (fan resale) | wallet-mediated transfer naming the operator as provider |

These markers are Splice contracts (`splice-amulet` packages), deliberately
**not** vendored into this DAR: the model stays portable to any Canton
ledger, and the marker emission is a property of how the operator's
automation *submits* commands on MainNet, not of the business templates.
Wiring it up = adding the splice DARs to the deployment and including the
marker create in the same command submission the triggers already make.

## 4. The incentive economics (why this matters commercially)

Current Canton Coin mechanics
([tokenomics docs](https://docs.digitalasset.com/integrate/devnet/tokenomics-and-rewards/index.html),
[reward-shift coverage](https://cantonnews.org/canton-ends-passive-validator-rewards-as-incentives-shift-toward-usage)):

- **Burn-mint equilibrium**: traffic fees and holding fees burn CC; minting
  rounds create it against reward coupons. Fair launch — no premine.
- **As of 30 Apr 2026, passive validator liveness rewards are zero.** The
  network pays for *usage*, not uptime. An idle validator earns nothing.
- **Applications get the largest share of the reward pool — 62% until
  mid-2029** (SV allocation down to 20%). Featured apps currently mint
  rewards worth substantially more than their transactions burn in traffic
  fees.

Implication for TIX: every primary sale, sweep, tranche trade and resale is
billable network activity. With Featured App status, the operator's effective
infrastructure cost is negative at meaningful volume — the ticketing platform
is paid by the network for the activity it brings, on top of its own fees.
That is the business case to put in front of the SV vote: KYD's ~150k
fans/month is exactly the "measurable network value" the post-April-2026
incentive design pays for.

## 5. Canton Coin / CIP-56 as the settlement asset

**Status: the registry and resale rail are implemented.** `Kyd.Cash` implements
the CIP-56 `Holding` interface, and `Kyd.Registry` implements the standard
`TransferFactory`, `AllocationFactory` and `Allocation` over it — the same
architecture as Canton Coin's Amulet. Ticket resale settles by calling the
`AllocationFactory` and executing the resulting `Allocation`s
(`Ticket_OfferDvP` → `DvPResale_Settle`), tested end-to-end. On the network,
swap the vendored interface DAR for the official `splice-api-token-*-v1`
releases and point the wallet at Canton Coin / USDCx — the identical settlement
code runs. Financing commitments and revenue shares use the same lock-in-place
custody (audit KYD-02 resolved). The production swap follows the
[Canton Network token standard (CIP-56)](https://www.canton.network/blog/what-is-cip-56-a-guide-to-cantons-token-standard) /
[Token Standard APIs](https://docs.global.canton.network.sync.global/app_dev/token_standard/index.html):

- **Holdings API** (`splice-api-token-holding-v1`) replaces `Cash` balances —
  any CIP-56 asset (Canton Coin, tokenized deposits, stablecoins) becomes
  spendable in TIX without code changes per asset.
- **Transfer-instruction API** replaces `Cash_Transfer` legs (free-of-payment).
- **Allocation API** replaces our escrow pattern: financing commitments and
  revenue-share carve-outs become standard **locked allocations** that the
  registry — not the app operator — custodies. This retires KYD-02 and is the
  pattern wallets/exchanges already understand.
- **Metadata API** lets TICKS itself surface as a standardized asset for
  portfolio UIs.

The seams in the model map one-to-one: `Cash_Split`/`Cash_Transfer` call
sites become allocation executions; `Cash_Disclose` disappears (the standard
handles visibility); the waterfall logic in `Kyd.Tix` is unchanged.

## 6. Production topology

| Concern | Plan |
| --- | --- |
| Node | One validator (participant + validator app) for `KYD-Operator`; venues/lenders optionally on their own validators — the Daml model is topology-agnostic |
| Synchronizer | Global Synchronizer on MainNet; the model's hot path is key-free, so it is unaffected by Canton's multi-domain key-uniqueness restriction |
| Auth | JWT (OAuth2/OIDC) on the Ledger API and JSON API; each UI/automation gets a scoped app-user |
| Upgrades | SCU (LF 1.17, protocol 7): ship `kyd-tix-0.2.0` with appended `Optional` fields, zero downtime, no migrations |
| Monitoring | Validator app + scan metrics; trigger health = pending `PurchaseOrder`/`RevenueShare` age alarms |
