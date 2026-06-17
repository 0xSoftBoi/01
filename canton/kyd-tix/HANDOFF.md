# Handoff

Everything the next engineer needs to take this from demo to production,
honestly labeled. Start here, then `README.md` for the architecture story and
`DESIGN.md` for the decision record (why each choice, and the open questions
for KYD).

## One-command map

```
make test     # Daml: 2 packages, 28 scenarios (functional/adversarial/CIP-56)
make app      # web app: codegen + type-check + production build
make demo     # local stack: sandbox + seed + JSON API + 3 triggers
              # then: cd app && npm run dev  (web)  /  ios/KYDFan (Xcode)
```

CI (`.github/workflows/kyd-tix.yml`) runs the Daml suite and the web build on
every push touching this tree.

## What is verified, and how

| Layer | Verification |
| --- | --- |
| Daml model (`daml/`) | 32 scenarios in CI: functional + adversarial attack suites + CIP-56 interface suites + demo seed. Zero warnings (divulgence-free). |
| Multi-participant privacy (`privacy-proof/`) | **Proven on a real 2-participant + 1-domain Canton network** (`./run.sh`): a p1-only contract is provably absent from a live p2 node. Race-free Daml Script, 3 deterministic passes. Not in CI (needs a running Canton); run on demand. |
| Web app (`app/`) | Type-check + production build in CI. The full runtime loop (JWT → catalog → split → order → trigger fill → pass; financing receipt escrowed) was driven over HTTP against the running stack during development. |
| Triggers (`Kyd.Triggers`) | Compile into the DAR; listed by the runner; fills exercised end-to-end in the runtime loop above. |
| CIP-56 integration | `Cash` implements `Holding`; `Kyd.Registry` implements the standard `TransferFactory`/`AllocationFactory`/`Allocation`. Resale + transfers tested through these real factories. NOT yet run against live Canton Coin/USDCx package ids (swap the vendored DAR for the official releases). |
| iOS app (`ios/KYDFan`) | Source-complete, no dependencies, same API contract as the verified web app — but **not compiled** (no macOS CI leg). Expect a first-build pass on a Mac. |
| Validator ops (`validator/`) | Documentation + runbook with sourced commands. No node was stood up from this repo. |

## Production gaps, in priority order

1. **Auth**: replace sandbox unsigned JWTs (`app/src/api.ts`,
   `ios .../LedgerClient.swift`) with OAuth2/OIDC in front of the JSON API;
   TLS everywhere. The token shape is already production-form.
2. **Real money**: swap `Kyd.Cash` for CIP-56 holdings (Canton Coin/USDCx).
   All settlement — resale, commitments, and revenue shares — already speaks
   the standard `Holding`/`Allocation`/factory interfaces with lock-in-place
   custody (audit KYD-02 resolved), so this is a `Kyd.Registry` dependency
   change plus replacing the vendored interface package with the official DARs
   (one daml.yaml line).
3. **Catalog service**: the demo reads the catalog with the operator party
   from the browser; production puts that read behind a backend endpoint
   (same trust model, no operator-readable token in any client).
4. **PSP on-ramp**: `topUp` is the webhook handler's job server-side.
5. **Featured App wiring**: emit `FeaturedAppActivityMarker`s from the trigger
   submissions (validator/RUNBOOK.md §3 has the emission points).
6. **iOS**: first Xcode build, then real auth + push notifications for offers.

## Key design decisions (don't re-litigate without reading these)

- Contention architecture (cold master / hot shards, create-only receipts,
  batch sweep): README "Canton engineering" — this is why on-sales scale.
- Operator as joint controller on market clears: matches the agent-bank role;
  removing it breaks Daml visibility rules (see AUDIT.md trust model).
- Gifts carry no royalty (KYD-07): deliberate; mitigate at app layer.
- Keys only on cold contracts: Canton multi-domain cannot enforce key
  uniqueness; the hot path is key-free on purpose.

## File map

```
daml/                 the model (8 modules) + 4 test modules
splice-token-standard/ vendored CIP-56 interfaces (separate package, SCU rule)
app/                  web product (React/TS, PWA-installable)
ios/KYDFan/           native fan app (SwiftUI, XcodeGen)
integration/          JSON API config, local stack script, headless client
validator/            network strategy (README) + operational runbook
AUDIT.md              trust model, findings KYD-01..07, attack coverage
```
