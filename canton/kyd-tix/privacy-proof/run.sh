#!/usr/bin/env bash
# Prove participant-level sub-transaction privacy on a REAL two-participant
# Canton network (not the in-memory test runner). End to end, ~1-2 min.
#
# Prereq: `daml` on PATH (https://get.daml.com). Isolated from the main build:
# this package is not in multi-package.yaml, so `daml test` / CI never run it.
set -euo pipefail
cd "$(dirname "$0")"

CANTON_JAR="$HOME/.daml/sdk/2.10.4/canton/canton.jar"
DAR=.daml/dist/kyd-privacy-proof-0.1.0.dar

echo "1/5  building model + proof DARs"
( cd .. && daml build --all >/dev/null )
daml build >/dev/null

echo "2/5  starting a 2-participant + 1-domain Canton network"
pkill -f canton.jar 2>/dev/null || true   # free ports 6011/6021/6018 from any prior run
java -Xmx3g -jar "$CANTON_JAR" daemon -c canton.conf --bootstrap connect.canton > /tmp/canton-privacy.log 2>&1 &
CANTON=$!
trap 'kill $CANTON 2>/dev/null || true' EXIT
until grep -q CANTON_READY /tmp/canton-privacy.log; do sleep 3; done
grep CANTON_READY /tmp/canton-privacy.log

echo "3/5  uploading the DAR to participant p1 and participant p2"
daml ledger upload-dar --host localhost --port 6011 "$DAR"
daml ledger upload-dar --host localhost --port 6021 "$DAR"

echo "4/5  running the cross-participant privacy proof"
daml script --dar "$DAR" --script-name PrivacyProof:privacyProof \
  --participant-config participants.json

echo "5/5  PASS — participant-level privacy proven on real Canton"
