#!/usr/bin/env bash
# Boot the full local stack: sandbox ledger + HTTP JSON API + the operator's
# automation triggers. Once up, the KYD web app (or integration/client) drives
# everything over HTTP on :7575.
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

# 2. HTTP JSON API on :7575 — the bridge the web app calls.
daml json-api --config integration/json-api.conf &
JSONAPI_PID=$!

# 3. Operator automation: auto-fill purchase orders (shard load-balancing),
#    batch revenue sweeps, and nightly late-interest accrual — all under the
#    KYD-Operator party.
daml trigger --dar "$DAR" --trigger-name Kyd.Triggers:autoFillOrders \
  --ledger-host localhost --ledger-port 6865 --ledger-party KYD-Operator &
FILL_PID=$!
daml trigger --dar "$DAR" --trigger-name Kyd.Triggers:sweepRevenue \
  --ledger-host localhost --ledger-port 6865 --ledger-party KYD-Operator &
SWEEP_PID=$!
daml trigger --dar "$DAR" --trigger-name Kyd.Triggers:accrueLateInterest \
  --ledger-host localhost --ledger-port 6865 --ledger-party KYD-Operator &
ACCRUE_PID=$!

echo "Stack up: JSON API on http://localhost:7575 — Ctrl-C to stop."
wait
