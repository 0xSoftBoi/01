#!/usr/bin/env bash
# Proves Canton's own ledger-api — not just this server's app-level logic —
# verifies these RS256 tokens' signatures, gates on real identity, AND (now)
# that a genuine fan login through this server's own /auth/login works end
# to end against that same real, signature-verifying, User-Management-
# enforcing participant. See prove.ts and server/README.md for the earlier,
# narrower run of this proof and what it found (which is what this version
# closes: server/src/userManagement.ts's Daml User provisioning).
#
# Standalone: assumes ports 4001/6041/6042/6048/6049/7576 are free (does NOT
# reuse a running integration/run-local.sh stack, which also uses :4001 —
# don't run both at once).
#
# Prereq: `daml` on PATH (https://get.daml.com), Node on PATH, `fuser`
# (psmisc; used to free :4001 between server restarts). ~30-60s.
set -euo pipefail
cd "$(dirname "$0")"

pkill -9 -f "canton.jar.*daemon -c canton.conf" 2>/dev/null || true

CANTON_JAR="$HOME/.daml/sdk/2.10.4/canton/canton.jar"
WORK=/tmp/kyd-auth-proof
rm -rf "$WORK"
mkdir -p "$WORK"
# canton.conf's participant is "p1" — a real Canton participant's ledger id
# defaults to its own node name, never "sandbox" (that's specific to
# `daml sandbox`; found live, see tokens.ts's LEDGER_ID comment).
export LEDGER_ID=p1

# Also does the kill-any-stale-instance step itself (called both for the
# first boot and the step-6 restart below) — a leftover server from a prior
# run, or the previous instance still shutting down, binding :4001 would
# make the "wait for /health" check pass against the WRONG process, one
# signing with a stale key that doesn't match this run's admin token
# (found live). Kills by PORT (fuser), not by process-name pattern (pkill
# -f): `npx tsx ...` runs through npm/sh wrapper layers that exec() into a
# final node+tsx-loader command line not guaranteed to contain the literal
# "tsx src/index.ts" substring — pattern matching missed it and left the
# old process holding the port (found live).
start_server() {
  fuser -k 4001/tcp 2>/dev/null || true
  sleep 1   # let the OS release :4001 before the next process tries to bind it
  ( cd .. && \
    PORT=4001 JSON_API_URL=http://localhost:7576 LEDGER_ID=p1 \
    DEMO_PARTIES_PATH="$WORK/demo-parties.json" SIGNING_KEY_PATH="$WORK/signing-key.pem" \
    npx tsx src/index.ts >> "$WORK/auth-server.log" 2>&1 ) &
  until curl -sf http://localhost:4001/health >/dev/null 2>&1; do sleep 1; done
}

echo "1/7  minting a one-off admin token (persists the signing key to $WORK/signing-key.pem)"
cd ..
npm install --no-audit --no-fund >/dev/null
cd auth-proof
SIGNING_KEY_PATH="$WORK/signing-key.pem" npx tsx mint-admin-token.ts > "$WORK/admin.jwt"

echo "2/7  starting a single Canton participant requiring jwt-rs-256-jwks auth on its ledger-api"
java -Xmx2g -jar "$CANTON_JAR" daemon -c canton.conf --bootstrap connect.canton \
  > "$WORK/canton.log" 2>&1 &
CANTON_PID=$!
trap 'kill $CANTON_PID ${JSONAPI_PID:-} 2>/dev/null; fuser -k 4001/tcp 2>/dev/null; true' EXIT
until grep -q CANTON_READY "$WORK/canton.log" 2>/dev/null; do sleep 3; done
grep CANTON_READY "$WORK/canton.log"

echo "3/7  starting the auth server (:4001) early — just for its JWKS and admin-scoped party allocation"
cat > "$WORK/demo-parties.json" <<'EOF'
{"operator":"placeholder","venue":"placeholder","artist":"placeholder","alice":"placeholder","bob":"placeholder","lender":"placeholder","lender2":"placeholder"}
EOF
start_server

echo "4/7  starting the JSON API against THIS participant (:7576)"
daml json-api --config json-api.conf > "$WORK/json-api.log" 2>&1 &
JSONAPI_PID=$!
until curl -sf http://localhost:7576/readyz >/dev/null 2>&1; do sleep 2; done

echo "5/7  allocating a real Alice party under the admin token"
ALICE=$(curl -sS -X POST http://localhost:7576/v1/parties/allocate \
  -H "authorization: Bearer $(cat "$WORK/admin.jwt")" -H "content-type: application/json" \
  -d '{"identifierHint":"Alice"}' | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>process.stdout.write(JSON.parse(d).result.identifier))')
echo "     allocated: $ALICE"
cat > "$WORK/demo-parties.json" <<EOF
{"operator":"placeholder","venue":"placeholder","artist":"placeholder","alice":"$ALICE","bob":"placeholder","lender":"placeholder","lender2":"placeholder"}
EOF

echo "6/7  restarting the auth server so /auth/login's loginable map picks up the real Alice party"
start_server

echo "7/7  running the proof"
SIGNING_KEY_PATH="$WORK/signing-key.pem" npx tsx prove.ts
