# Validator runbook (operational)

The strategy (roles, Featured App path, incentives, CIP-56) is in
[README.md](README.md). This is the do-this-then-that companion for the
engineer actually standing the node up. Commands reference the official
Splice docs — versions move, so always cross-check
[docs.sync.global](https://docs.sync.global/validator_operator/validator_onboarding.html).

## 0. Prerequisites

- Docker + Compose (or k8s + Helm for production-grade), 8+ vCPU / 32GB RAM
  recommended for MainNet.
- A static egress IP (one per network; SVs allowlist it).
- An onboarding secret:
  - **DevNet**: self-service per the docs.
  - **TestNet/MainNet**: Tokenomics Committee approval via
    [sync.global/validator-request](https://sync.global/validator-request/),
    then your SV sponsor issues the secret. Allowlist propagation: 2–7 days.

## 1. Stand up the node (Docker Compose path)

Follow the compose guide at docs.sync.global → Validator Operations →
Docker-Compose deployment. The short of it:

```
git clone https://github.com/hyperledger-labs/splice && cd splice
# per docs: cd cluster/compose/validator (path varies by release)
export ONBOARDING_SECRET=...      # from your sponsor
export SPONSOR_SV_URL=...         # sponsor's SV endpoint
export MIGRATION_ID=...           # current synchronizer migration id (docs)
./start.sh -s "$SPONSOR_SV_URL" -o "$ONBOARDING_SECRET" -p kyd -m "$MIGRATION_ID" -w
```

Health checks:
- Wallet UI reachable (default `http://wallet.localhost`); login creates/
  onboards your validator operator user.
- `curl <validator>/api/validator/v0/validator-user` returns your operator.
- Scan UI of your sponsor shows your validator's liveness rounds after a few
  ticks (this is what reward eligibility keys off).

## 2. Deploy kyd-tix onto the node

```
make build                                   # from canton/kyd-tix
daml ledger upload-dar .daml/dist/kyd-tix-0.1.0.dar \
  --host <participant-ledger-api> --port 5001   # port per your deployment
```

- Allocate the production parties (operator, venue(s), artist(s)) on the
  participant; fans are onboarded dynamically (hosted parties).
- Run the three triggers as services against the Ledger API under the
  operator party (systemd/k8s Deployment; same flags as
  `integration/run-local.sh`).
- Point the JSON API at the participant; put OAuth2/OIDC in front (the
  sandbox's unsigned-JWT shortcut is local-only) and TLS in front of that.
- Swap the vendored CIP-56 package for the official `splice-api-token-*-v1`
  DARs (see `splice-token-standard/README.md`) so package ids match Canton
  Coin / USDCx.

## 3. Featured App + rewards (after MainNet onboarding)

1. Apply through the foundation's Featured Application process (or a direct
   SV sponsorship → ⅔ SV vote). The grant lands as a `FeaturedAppRight`
   contract on your operator party.
2. Wire marker emission: include the `FeaturedAppActivityMarker` create in
   the same command submissions the triggers already make (fills, sweeps,
   tranche accepts) — the four emission points are tabled in README.md §3.
3. Watch `AppRewardCoupon`s accrue to the operator in the wallet UI; they
   convert to Canton Coin automatically in minting rounds.

## 4. Day-2 operations

| Concern | What to watch | Action |
| --- | --- | --- |
| Trigger health | Age of oldest open `PurchaseOrder` / `RevenueShare` | Restart trigger service; orders are self-guarding so replays are safe (`dedupExercise`) |
| Contention | Command rejections spike on a hot on-sale | Open more same-price shards (`Event_OpenAllocation`) — the model parallelizes by design |
| Upgrades | New kyd-tix version | SCU path: bump version, append-only Optional changes, `daml ledger upload-dar`; no migration, no downtime (LF 1.17 / PV7) |
| Synchronizer migrations | GSF-announced migration ids | Follow the splice release runbook; validators must roll before the deadline |
| Backups | Participant DB (Postgres) | Standard PG backup; the ledger is the source of truth, UIs are stateless |
