# KYD web app — the product on top of the ledger

KYD's value-add is that fans never feel the blockchain: tap a show, pay,
get a QR pass, sell it on (capped) if plans change. This app is that product
surface over the Daml model — React + TypeScript, typed end-to-end with
`daml codegen js` bindings, talking to the HTTP JSON API.

```
integration/run-local.sh      # sandbox + demo seed + JSON API + server + triggers
cd app
npm run codegen               # typed bindings from the built DAR
npm install
npm run dev                   # http://localhost:5173
```

| Discover | My Tickets | Wallet |
| --- | --- | --- |
| ![Discover tab](../docs/screenshots/01-discover.png) | ![My Tickets QR pass](../docs/screenshots/02-my-tickets.png) | ![Wallet top-up](../docs/screenshots/03-wallet.png) |

Screenshots are the production build running the standalone demo
(`VITE_DEMO_MODE=true npm run build && npm run preview`) — the exact bundle
behind the [live demo](https://01-35l7.vercel.app); the full gallery,
including the venue and artist roles, is in the
[top-level README](../README.md#the-product-app).

## What the demo shows

Switch roles in the header — each role acts under its OWN party's authority:

- **Alice / Bob (fans)** — *Discover*: live price levels straight from the
  open `TierAllocation` shards (watch GA step 50 → 55 as levels sell);
  one-tap Buy signs a `PurchaseOrder` and the operator's trigger fills it —
  the pass appears in *My Tickets* when the atomic fill commits. *My
  Tickets*: QR passes (the QR is the contract id — one valid copy, ever),
  resale with the anti-scalping cap as a hard limit in the form AND on the
  ledger, incoming offers to accept/decline.
- **Brooklyn Bowl (venue)** — *Door*: the manifest per show; Check in
  exercises the consuming choice, so double-scans are impossible. *Dashboard*:
  inventory per tier with the next demand-curve price, one-click "open 5
  more" at the current curve step, the TIX register (per-lender outstanding)
  and pending revenue-share escrows the venue cannot touch.
- **Robert Plant (artist)** — *Royalties*: the balance that accrues
  automatically from every capped resale, plus per-show fan visibility (the
  artist signs the event, so fan data is theirs by construction).

## Standalone demo build (no Canton behind it)

`npm run dev`/`preview` above talks to a real running stack. There is also a
`VITE_DEMO_MODE=true` build (`vercel.json` sets it automatically) that swaps
every network call in `api.ts` for `src/demo/mock.ts` — an in-browser
simulation good enough to host the exact same UI standalone, e.g. on Vercel,
with no Canton participant, JSON API or server behind it at all:

```
VITE_DEMO_MODE=true npm run build && npm run preview
```

`demo/mock.ts` is not a stub — it reimplements the actual choice logic
(`Cash_Split`/`Merge`, `Ticket_Offer`/`_CheckIn`, `ResaleOffer_Accept`,
`Event_OpenAllocation`, …) against a plain in-memory store, seeded with the
same numbers as `Kyd.Demo:setup`, plus two `setInterval` loops standing in for
the `autoFillOrders`/`sweepRevenue` triggers. `exactNote` and `placeOrder` in
`api.ts` are untouched between the two modes — they're written against the
generic `Ledger` shape (`query`/`create`/`exercise`), so they run identically
against the mock as against the real `@daml/ledger` client. A `DEMO` badge in
the header and the wallet sheet's copy make clear when a deploy is running
this simulation rather than talking to a live ledger. A build with
`VITE_DEMO_MODE=true` set produces byte-identical numbers to the real stack
for the same sequence of actions (verified: the TIX lender-outstanding figures
after one GA sale match exactly between the two modes).

## UX-architecture notes (the part that matters)

- **No wallet required (but one can connect).** By default, fan parties are
  hosted on the operator's validator; "login" is an identity pick here —
  `POST /auth/login` against `../server` (`useSession` in `api.ts`) — that in
  production becomes a phone/email/OIDC login in front of the same real,
  RS256-signed token issuance (see `server/README.md`). Money is a balance; the
  note-splitting plumbing (`exactNote`) lives in `api.ts` and never reaches a
  component. For Canton-native users, the header's **Connect wallet** chip opens
  a self-custody path (`wallet.ts`, `components/WalletConnect.tsx`): a
  party-disclosure handshake — not a seed import — after which balances are read
  through the CIP-56 `Holding` interface `Kyd.Cash` implements, the same one
  Loop / Canton Coin wallets read via an `InterfaceFilter`. It's purely
  additive: linking a wallet surfaces self-custody holdings, it doesn't reroute
  the demo's purchase path. In `VITE_DEMO_MODE` the handshake is simulated
  per-provider; against a live participant it reports the bridge unavailable
  rather than hanging (no browser wallet connector is wired in this build yet).
- **Catalog vs. authority.** Fans are not stakeholders of `Event` /
  `TierAllocation` (privacy by default), so the catalog is read through the
  operator — exactly the backend-API role KYD's web2 app plays today. That
  operator session lives in `../server` now, not the browser: the app calls
  `GET /catalog` (`useCatalog` in `api.ts`) and gets plain JSON back, never a
  token. Every *action* (buy, resell, accept) is still signed by the fan's
  own party, using the token `/auth/login` issued for that role.
- **The automation IS the UX.** Buying feels instant because the
  price-aware `autoFillOrders` trigger races the UI's 2s poll; nothing in the
  front end ever holds operator authority — literally: there is no code path
  left in `api.ts` that constructs a token for any party but the one
  currently logged in.
- Session tokens are real (RS256, signature-verified against a published
  JWKS), minted by `../server`; production points that server's identity
  step at a real OAuth2/OIDC provider instead of the demo's role picker.
