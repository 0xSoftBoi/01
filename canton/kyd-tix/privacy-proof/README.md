# Multi-participant proofs on real Canton

The rest of this repo verifies behaviour on the single-participant test runner.
This package proves, on a **real two-participant + one-domain Canton network**
(the bundled Canton, not sandbox), two things:

1. **`PrivacyProof`** — Canton's headline guarantee, participant-level
   sub-transaction privacy, on the `Cash` primitive.
2. **`AppOnCanton`** — the FULL KYD app (cold-master/hot-shard issuance, a paid
   primary sale via the operator's fill, a cross-participant gift) running on
   real Canton, proving a competing venue and fans on a separate participant
   never see another venue's events, inventory or tickets.

```
./run.sh        # builds, boots 2 participants + 1 domain, uploads, runs both proofs
```

## Topology (`canton.conf`)

Two independent participant nodes — `p1` and `p2`, each its own storage/trust
boundary — both connected to one synchronization domain (`mydomain`,
protocol version 7). Operator + Alice are hosted on `p1`; Bob on `p2`.

## What the proof asserts (`daml/PrivacyProof.daml`)

Every assertion is **race-free** — each query is local to the queried party's
own participant, so the result is deterministic despite cross-participant
propagation being eventually consistent.

1. Operator (p1) issues a `Cash` holding to Alice (p1) — stakeholders are
   p1-only. Alice's node holds it.
2. **p2 is a live participant** — Bob creates a contract on his own node and
   sees it. (Rules out the trivial "p2 is just empty/broken" explanation.)
3. **Bob's live node never received Alice's contract** — `queryContractId bob
   aliceCash` returns `None` and Bob's ACS is empty. *This is the privacy
   property:* same global ledger, but p2's store physically lacks the contract,
   because no p2-hosted party is a stakeholder.
4. **Cross-participant commit** — Operator (p1) issues to Bob (p2); the submit
   committing proves p1 and p2 are distinct nodes connected via the shared
   domain (p2 had to take part as the observer's participant).
5. **Party-level privacy within a participant** — Alice, also on p1, is not a
   stakeholder of Bob's holding, so even though it sits in p1's store she
   cannot see it.

## Verified output (3 consecutive deterministic runs, exit 0)

```
$ ./run.sh
CANTON_READY participants=2 connected p1=true p2=true
DAR upload succeeded.    (p1)
DAR upload succeeded.    (p2)
PRIVACY PROVEN on a real 2-participant Canton network:
  - p2 is a live participant (Bob transacts there) ...
  - ... yet it never received Alice's p1-only contract
  - cross-participant create commits; non-stakeholders (Alice) still can't see it
PASS — participant-level privacy proven on real Canton
```

The Daml Script exits 0 only if every assertion holds — including that Bob's
live participant returns `None` for Alice's contract and that his ACS is empty.

## The full app on real Canton (`daml/AppOnCanton.daml`)

Realistic hosting: the KYD platform, Venue A, its artist and a fan (Alice) are
on `p1`; a competing Venue B and another fan (Bob) are on `p2`. The script runs
the real product flow — Venue A creates an event, carves a hot `TierAllocation`
shard off the cold `Event` master, Alice places a `PurchaseOrder` and the
operator's engine fills it — entirely on real Canton, then asserts (race-free):

- the competing venue's node holds **none** of Venue A's `Event`s;
- `p2` holds **none** of Venue A's inventory shards or Alice's `Ticket`;
- `p2` is live (Bob transacts on his own node);
- a cross-participant **gift** (Alice on p1 → Bob on p2) commits across the
  domain.

This validates that the contention architecture *and* the privacy model hold on
real multi-participant Canton — not just the in-memory runner. Both proofs run
deterministically (verified across repeated runs, script exit 0).

## Why it's a separate package

It needs a running multi-node Canton (not the in-memory runner), so it is kept
out of `multi-package.yaml` — `daml build --all`, `daml test` and CI stay
single-participant and fast. Run this one on demand with `./run.sh`.
