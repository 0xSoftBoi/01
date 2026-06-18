# Integration & automation layer

The Daml model in `../daml` is the on-ledger logic. This directory is everything
**off-ledger** that turns it into a running service the existing KYD web app can
drive: operator automation (Daml Triggers) and the HTTP/JSON + TypeScript bridge.

```
KYD web app  ──HTTP/JSON──▶  JSON API (:7575)  ──gRPC──▶  Canton / sandbox (:6865)
   ▲  typed bindings (daml2js: @kyd/kyd-tix-0.1.0)              ▲
   │                                                            │ operator authority
   └────────────── reads tickets/loans ────────────────────────┘
                                                       Daml Triggers (auto-fill, accrual)
```

## Daml Triggers — `../daml/Kyd/Triggers.daml`

Triggers are long-running processes that react to ledger events under one
party's authority (here `KYD-Operator`), turning the manual operator choices
into hands-off services:

- **`autoFillOrders`** — whenever a fan submits a `PurchaseOrder`, picks a
  matching open `TierAllocation` shard and fills against it (this rule is the
  shard load-balancer). The fill is atomic (payment → venue, financing share →
  escrowed receipt, ticket minted) and self-guarding, so an order priced below
  the shard's price just fails ledger-side.
- **`sweepRevenue`** — every few minutes, sweeps all pending `RevenueShare`
  receipts of each facility through the loan in ONE consuming exercise — the
  batching pattern that keeps the loan contract cold however hot sales run.
- **`accrueLateInterest`** — on a daily heartbeat, attempts late-interest
  accrual on every `SyndicatedLoan`. The choice self-guards on elapsed time, so
  it is a no-op until a full day rolls over past maturity, then applies exactly
  one accrual.

List them against the DAR:

```
daml trigger list --dar ../.daml/dist/kyd-tix-0.1.0.dar
#   Kyd.Triggers:accrueLateInterest
#   Kyd.Triggers:autoFillOrders
#   Kyd.Triggers:sweepRevenue
```

## JSON API + daml2js — `client/`

`codegen.sh` runs `daml codegen js` over the DAR to produce fully-typed
TypeScript bindings under `client/daml.js` (npm scope `@kyd`), one package per
Daml package. `client/src/buyTicket.ts` shows the web-app side of the paid-sale
flow: a fan creates a `PurchaseOrder` over HTTP and waits for the operator's
trigger to mint the ticket — the same path `testPaidPrimarySaleRoutesRevenue`
covers in Daml Script, but over the wire with compile-time-checked templates,
choices and contract IDs.

## Running it

```
./run-local.sh          # sandbox + JSON API + both triggers (Ctrl-C to stop)

cd client
npm run codegen         # generate ../client/daml.js bindings from the DAR
npm install
KYD_FAN_TOKEN=... KYD_OPERATOR_PARTY=... KYD_VENUE_PARTY=... KYD_FAN_PARTY=... \
  npm start             # places an order; the trigger fills it
```

## Contention benchmark (`client/src/bench.ts`)

Turns the cold-master / hot-shard *argument* into a *measured number*. It fires
the same concurrent issuance load two ways and compares throughput:

- **1 shard** — N concurrent `Allocation_Issue` against ONE `TierAllocation`.
  Each is a consuming choice, so they contend on one contract; Canton serializes
  them and the client retries on the stale-cid rejections.
- **N shards** — N concurrent issues, one per shard. Disjoint contracts, no
  contention — they commit in parallel.

Measured on a local single-node sandbox (`npm run bench -- <concurrency>`):

| Concurrent issues | 1 shard | N shards | Speedup | Contention retries |
| --- | --- | --- | --- | --- |
| 16 | 3.8 issues/s | 32.7 issues/s | **8.7×** | 113 → **0** |
| 24 | 2.5 issues/s | 34.6 issues/s | **13.7×** | 258 → **0** |

The speedup *grows* with concurrency (more contention on the single shard), and
sharding eliminates contention retries entirely — exactly what the architecture
predicts. A multi-core participant widens the gap further; this is the
contention floor, not the ceiling.

```
./run-local.sh            # (or a bare sandbox + seed + JSON API)
cd client && npm run codegen && npm install
npm run bench -- 24       # 24 concurrent issues, 1-shard vs 24-shard
```

## What is verified here vs. operational

- **Verified in this environment**: triggers compile into the DAR and are listed
  by the runner; `daml codegen js` generates the `@kyd/kyd-tix-0.1.0` bindings
  (all six modules) cleanly.
- **Operational** (needs a live ledger + JWTs, so scripted not run here):
  `run-local.sh` booting the sandbox/JSON API/triggers, and the `client`
  npm install/start against it.
