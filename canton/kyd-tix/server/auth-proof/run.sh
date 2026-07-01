#!/usr/bin/env bash
# Proves Canton's own ledger-api — not just this server's app-level logic —
# verifies these RS256 tokens' signatures and gates on real identity. Boots
# a real, single-participant Canton configured with a `jwt-rs-256-jwks`
# auth-service, then throws five things at its JSON API: a legitimate admin
# token, one forged with a different key, a bit-flipped copy of a real one,
# no token at all, and a validly-signed token naming a user that was never
# provisioned — checking Canton's own verdict on each. See prove.ts and
# server/README.md for what this scope covers and what it doesn't (a real,
# named follow-up: full per-fan login needs Daml User Management
# provisioning this server doesn't do yet).
#
# Standalone: assumes ports 4001/6041/6042/6048/6049/7576 are free (does NOT
# reuse a running integration/run-local.sh stack, which also uses :4001 —
# don't run both at once).
#
# Prereq: `daml` on PATH (https://get.daml.com), Node on PATH. ~30-60s.
set -euo pipefail
cd "$(dirname "$0")"

# A leftover server from a prior aborted run binding :4001 would make the
# "wait for /health" check below pass against the WRONG process — one
# signing with a stale key that doesn't match this run's admin token
# (found live).
pkill -9 -f "tsx src/index.ts" 2>/dev/null || true
pkill -9 -f "canton.jar.*daemon -c canton.conf" 2>/dev/null || true

CANTON_JAR="$HOME/.daml/sdk/2.10.4/canton/canton.jar"
WORK=/tmp/kyd-auth-proof
rm -rf "$WORK"
mkdir -p "$WORK"

echo "1/5  minting a one-off admin token (persists the signing key to $WORK/signing-key.pem)"
cd ..
npm install --no-audit --no-fund >/dev/null
cd auth-proof
SIGNING_KEY_PATH="$WORK/signing-key.pem" npx tsx mint-admin-token.ts > "$WORK/admin.jwt"

echo "2/5  starting a single Canton participant requiring jwt-rs-256-jwks auth on its ledger-api"
java -Xmx2g -jar "$CANTON_JAR" daemon -c canton.conf --bootstrap connect.canton \
  > "$WORK/canton.log" 2>&1 &
CANTON_PID=$!
trap 'kill $CANTON_PID ${JSONAPI_PID:-} 2>/dev/null; pkill -f "tsx src/index.ts" 2>/dev/null; true' EXIT
until grep -q CANTON_READY "$WORK/canton.log" 2>/dev/null; do sleep 3; done
grep CANTON_READY "$WORK/canton.log"

echo "3/5  starting the auth server (:4001) — only its JWKS endpoint matters for this proof"
cat > "$WORK/demo-parties.json" <<'EOF'
{"operator":"placeholder","venue":"placeholder","artist":"placeholder","alice":"placeholder","bob":"placeholder","lender":"placeholder","lender2":"placeholder"}
EOF
( cd .. && \
  PORT=4001 JSON_API_URL=http://localhost:7576 \
  DEMO_PARTIES_PATH="$WORK/demo-parties.json" SIGNING_KEY_PATH="$WORK/signing-key.pem" \
  npx tsx src/index.ts >> "$WORK/auth-server.log" 2>&1 ) &
until curl -sf http://localhost:4001/health >/dev/null 2>&1; do sleep 1; done

echo "4/5  starting the JSON API against THIS participant (:7576)"
daml json-api --config json-api.conf > "$WORK/json-api.log" 2>&1 &
JSONAPI_PID=$!
sleep 5

echo "5/5  running the proof"
SIGNING_KEY_PATH="$WORK/signing-key.pem" npx tsx prove.ts
