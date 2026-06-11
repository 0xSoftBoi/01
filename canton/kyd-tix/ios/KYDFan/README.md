# KYDFan — native iOS fan app (SwiftUI)

The fan surface as a native app: Discover (live price levels), one-tap buy
with the pass materializing in My Tickets, QR passes (CoreImage, no
dependencies), and the wallet with the simulated card on-ramp. It speaks the
same HTTP JSON API as the web app, with the same architecture: catalog reads
via the operator party, every action signed by the fan's own party.

## Build (requires a Mac with Xcode 15+)

```
brew install xcodegen
cd ios/KYDFan
xcodegen                      # generates KYDFan.xcodeproj
open KYDFan.xcodeproj         # select a simulator, Run
```

No external Swift dependencies. Alternatively create an empty iOS App project
in Xcode and drag `Sources/` in.

## Configure

1. Start the stack on your Mac: `integration/run-local.sh`, then in `app/`
   run `npm run dev` (the iOS app bootstraps identities from the Vite
   server's `/demo-parties.json`).
2. Paste the kyd-tix package id into `LedgerClient.packageId`
   (`grep '"name"' app/daml.js/kyd-tix-0.1.0/package.json` after codegen, or
   `daml damlc inspect-dar .daml/dist/kyd-tix-0.1.0.dar | grep -m1 kyd-tix`).
3. Simulator: works as-is (`localhost`). Physical iPhone: set
   `LedgerClient.host` to your Mac's LAN IP. The dev-only ATS exception in
   `project.yml` permits plain HTTP; remove it (and put TLS in front of the
   JSON API) before any distribution build.

## Status

Source-complete and conservative (iOS 16 APIs, async/await, no third-party
code), but **not compiled in CI** — this repo's CI has no macOS/Xcode leg.
First build on a Mac may surface minor type nits; everything architectural
(endpoints, payload shapes, token format) is identical to the web app, which
is verified end-to-end against the running stack.
