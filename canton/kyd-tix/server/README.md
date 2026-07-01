# server — the custody boundary in front of the ledger

Closes HANDOFF.md's production gaps #1 (auth), #3 (catalog service) and #4
(PSP on-ramp) with real code, not a plan: this is the one place an operator
credential exists, and it never crosses into the browser.

## What changed

Before this package, the web app (`app/`) held an operator-scoped Ledger
token directly, self-minted client-side and unsigned (`sandboxToken` in the
old `app/src/api.ts`) — good enough to talk to a local, unauthenticated
sandbox, but a real credential nonetheless: anyone who could read the
browser's JS could mint their own copy asserting `actAs: [operator]` and do
anything the operator can do (comp tickets, move commitments, mint Cash —
see AUDIT.md's KYD-11 for the ledger-side half of this exact problem).

Now:

- **Auth is real.** `POST /auth/login` exchanges a demo role for an
  RS256-signed, short-lived (15 min) token this server mints
  (`src/tokens.ts`, `src/identity.ts`). The signing key never leaves the
  server; `GET /.well-known/jwks.json` publishes only the public half
  (`src/keys.ts`, `src/jwks.ts`). A browser holding one of these tokens
  cannot mint another — it never had the private key.
- **The operator credential lives here, and only here.** `LedgerSession`
  (`src/ledgerSession.ts`) mints its own tokens on the operator's behalf and
  talks to the JSON API directly. `identity.ts`'s `loginable` map is built
  *without* the operator — `/auth/login` can never hand a browser one of
  its tokens, no matter what it's asked for.
- **Catalog reads are proxied**, not client-held. `GET /catalog`
  (`src/catalog.ts`) runs the events/allocations query under the operator
  session and returns plain JSON — the browser gets data, never a
  credential.
- **Minting only ever happens after a verified PSP signature.**
  `processPspWebhook` (`src/psp.ts`) is the one function that creates `Cash`;
  it requires a valid HMAC-SHA256 signature over the exact request bytes
  (Stripe/Adyen-style) before it will touch the ledger. `POST /webhooks/psp`
  (`src/webhook.ts`) is the real external route a PSP would call. This demo
  has no real card processor to round-trip through, so `POST
  /payments/topup` (`src/payments.ts`, gated by the FAN's own session token)
  synthesizes the exact signed event a real PSP would send and runs it
  through the identical `processPspWebhook` — there is no second, weaker
  mint path for the demo case.

## Run it

`../integration/run-local.sh` starts this automatically as step 4. Standalone:

```
npm install
DEMO_PARTIES_PATH=../app/public/demo-parties.json npm run dev   # :4001
```

## Test it

```
npm test
```

19 tests, no ledger required: token issuance/verification round-trips
(including a genuine HTTP fetch of `/.well-known/jwks.json` against a live
server in `test/jwks.test.ts` — the same fetch-and-verify a real relying
party performs), the auth route's operator exclusion, HMAC signature
accept/reject on the webhook route, and the catalog proxy.

## What's proven vs. documented

Beyond the unit suite, this was driven end to end against a real running
sandbox + JSON API + this server (`integration/run-local.sh`'s exact stack):
login as a seeded role, query the real JSON API with the issued token,
read the catalog proxy, top up through the fan's own session, and — the
adversarial case — hit the raw webhook route with a forged and then a
missing signature and confirm both are rejected (401) with the ledger
balance provably unchanged before/after. This is also what caught two real
bugs unit tests alone hadn't: the JSON API's classic `/v1/query` rejects
bare `<module>:<entity>` template-id strings (needs the `#<package-name>`
or full-hash form — fixed by routing `LedgerSession` through the same typed
`@daml/ledger` client the web app uses, not hand-rolled strings), and
Express 4 doesn't catch a rejected promise from an async handler — a ledger
client bug took the whole process down mid-request until every route that
touches the ledger was wrapped in `asyncRoute.ts`.

| Claim | Status |
| --- | --- |
| Tokens are RS256-signed and verify against the published JWKS | **Proven** — `test/tokens.test.ts`, `test/jwks.test.ts` (real HTTP fetch), and the live run above |
| `/auth/login` can never issue an operator-scoped token | **Proven** — `test/auth.test.ts`, and a live `403` on `{"partyKey":"operator"}` |
| A mint only ever happens behind a verified HMAC signature | **Proven** — `test/psp.test.ts`, and live: a forged and a missing signature both rejected (401) against the real webhook route with the ledger balance unchanged |
| Top-up mints exactly the requested amount into the fan's own balance | **Proven live** — real JSON API query before/after showed the balance move from one $500 note to $500 + $77 |
| The catalog proxy returns real ledger data with no credential in the response | **Proven live** — the seeded 2 events / 4 allocations, as plain JSON |
| A ledger-side failure degrades to a 502, not a crashed process | **Proven live** (see the bug note above) — `asyncRoute.ts` + `test/psp.test.ts`, `test/catalog.test.ts` |
| The browser never holds an operator-scoped ledger token | **Proven** — `app/src/api.ts` has no path left that constructs one; `catalog`/`topUp` go through this server |
| The signing key survives a process restart / is shared across processes (`SIGNING_KEY_PATH`) | **Proven** — `test/keys.test.ts` (deterministic RFC 7638 thumbprint `kid`, so two separate process invocations loading the same persisted key agree without coordinating) |
| **Canton's own ledger-api verifies these tokens' signatures, not just this server** | **Proven live** — `auth-proof/` (`./run.sh`, ~30-60s): a real, single-participant Canton configured with a `jwt-rs-256-jwks` auth-service pointed at this server's own `/.well-known/jwks.json`. Five real Canton verdicts, not app-level ones: a legitimate admin token **accepted** for a real ledger call; a token forged with a *different* signing key **rejected**; a bit-flipped copy of a real token **rejected**; no token at all **rejected**; a validly-signed token naming a `sub` with no provisioned rights **rejected**. |

### What that live run corrected

Running it surfaced a real fact about this Daml SDK/participant version that
changes the plan for full production auth, found the hard way rather than
assumed:

**Every token's `sub` is resolved through Canton's own User Management,
unconditionally** — even a token carrying an explicit `actAs`/`readAs`
claims blob (the format `tokens.ts` issues for every fan/venue/artist
login) is rejected with `UserNotFound` unless `sub` names a Daml `User`
that has actually been granted `CanActAs`/`CanReadAs` rights via
`UserManagementService`. There is no legacy bypass for this on the
participant config tested here. The one `sub` that *does* work out of the
box is the well-known `participant_admin` user every participant
provisions at boot (see `tokens.ts`'s `issueAdminToken`) — and even that
only has package/party-management rights, not an implicit "act as any
party."

Concretely, this means the auth **signing and verification mechanism** is
proven end to end (that's what `auth-proof/` demonstrates), but **the rest
of this server's token model — issuing plain actAs/readAs claims for
fan/venue/artist logins — has not itself been run against a
signature-verifying participant**, and per the finding above, it would be
rejected as-is. The real fix, scoped precisely rather than left vague: this
server needs to provision a Daml `User` (via `UserManagementService`, using
an admin-scoped session held only here — same custody-boundary principle as
the operator credential) for each party the first time it logs in, granting
it `CanActAs`/`CanReadAs` for that party, and set `sub` to that user's id
rather than the raw party string. That's a real, understood follow-up, not
"wire up a config line" — called out honestly rather than claimed, the same
standard this repo holds the CIP-56 official-package swap to (see
`HANDOFF.md`).

### Running the live proof

```
cd server/auth-proof
./run.sh
```

Standalone (assumes ports 4001/6041/6042/6048/6049/7576 are free — don't run
alongside `integration/run-local.sh`, which also uses `:4001`). Boots a real
Canton participant with `canton.conf`'s `jwt-rs-256-jwks` auth-service:

```hocon
canton.participants.<name>.ledger-api.auth-services = [{
  type = jwt-rs-256-jwks
  url = "http://localhost:4001/.well-known/jwks.json"
  target-audience = "https://kyd-tix-ledger/"   # must match tokens.ts's AUDIENCE
}]
```
