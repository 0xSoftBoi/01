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

- **`autoFillOrders`** — whenever a fan submits a `PurchaseOrder`, fills it. The
  fill is atomic (payment → venue, loan revenue-share carved out, ticket minted)
  and self-guarding, so an order priced below the tier's live price just fails
  ledger-side.
- **`accrueLateInterest`** — on a daily heartbeat, attempts late-interest
  accrual on every `SyndicatedLoan`. The choice self-guards on elapsed time, so
  it is a no-op until a full day rolls over past maturity, then applies exactly
  one accrual.

List them against the DAR:

```
daml trigger list --dar ../.daml/dist/kyd-tix-0.1.0.dar
#   Kyd.Triggers:accrueLateInterest
#   Kyd.Triggers:autoFillOrders
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

## What is verified here vs. operational

- **Verified in this environment**: triggers compile into the DAR and are listed
  by the runner; `daml codegen js` generates the `@kyd/kyd-tix-0.1.0` bindings
  (all six modules) cleanly.
- **Operational** (needs a live ledger + JWTs, so scripted not run here):
  `run-local.sh` booting the sandbox/JSON API/triggers, and the `client`
  npm install/start against it.
