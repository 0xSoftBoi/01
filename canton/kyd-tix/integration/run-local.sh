#!/usr/bin/env bash
# Boot the full local stack: sandbox ledger + demo seed + HTTP JSON API + the
# operator's automation triggers. Then run the product UI with:
#   cd app && npm run codegen && npm install && npm run dev
#
# Prereq: `daml` on PATH (https://get.daml.com). Ctrl-C tears the stack down.
set -euo pipefail
cd "$(dirname "$0")/.."

DAR=.daml/dist/kyd-tix-0.1.0.dar
daml build --all

# 1. Sandbox ledger on :6865, preloaded with the DAR.
daml sandbox --dar "$DAR" --port 6865 &
SANDBOX_PID=$!
trap 'kill $SANDBOX_PID ${JSONAPI_PID:-} ${FILL_PID:-} ${SWEEP_PID:-} ${ACCRUE_PID:-} 2>/dev/null || true' EXIT
sleep 10

# 2. Seed the demo world (parties, events, shards, financing, fan balances)
#    and publish the party ids for the web app's role switcher.
mkdir -p app/public
daml script --dar "$DAR" --script-name Kyd.Demo:setup \
  --ledger-host localhost --ledger-port 6865 \
  --output-file app/public/demo-parties.json

OPERATOR=$(tr -d ' \n' < app/public/demo-parties.json | sed -n 's/.*"operator":"\([^"]*\)".*/\1/p')
echo "Operator party: $OPERATOR"

# 3. HTTP JSON API on :7575 — the bridge the web app calls.
daml json-api --config integration/json-api.conf &
JSONAPI_PID=$!

# 4. Operator automation: auto-fill purchase orders (price-aware shard
#    matching), batch revenue sweeps, and nightly late-interest accrual.
daml trigger --dar "$DAR" --trigger-name Kyd.Triggers:autoFillOrders \
  --ledger-host localhost --ledger-port 6865 --ledger-party "$OPERATOR" &
FILL_PID=$!
daml trigger --dar "$DAR" --trigger-name Kyd.Triggers:sweepRevenue \
  --ledger-host localhost --ledger-port 6865 --ledger-party "$OPERATOR" &
SWEEP_PID=$!
daml trigger --dar "$DAR" --trigger-name Kyd.Triggers:accrueLateInterest \
  --ledger-host localhost --ledger-port 6865 --ledger-party "$OPERATOR" &
ACCRUE_PID=$!

echo "Stack up: JSON API on http://localhost:7575."
echo "Now: cd app && npm run codegen && npm install && npm run dev"
wait
