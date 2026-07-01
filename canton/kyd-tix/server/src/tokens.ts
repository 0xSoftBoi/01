import { SignJWT } from "jose";
import { keySet } from "./keys.js";

// Canton's participant `jwt-rs-256-jwks` auth-service validates iss/aud/exp
// against a config-declared JWKS URL (docs.daml.com/app-dev/authorization.html,
// docs.daml.com/canton/usermanual/apis.html — `auth-services = [{ type =
// jwt-rs-256-jwks, url = "<issuer>/.well-known/jwks.json", target-audience =
// "<AUDIENCE>" }]`). These constants are the values both this issuer and that
// participant config must agree on; see integration/README.md.
export const ISSUER = "https://auth.kyd-tix.example/";
export const AUDIENCE = "https://kyd-tix-ledger/";
// A real ledger-api command (not admin/party-management ones — those don't
// check this) rejects with LEDGER_ID_MISMATCH if the token's ledgerId claim
// doesn't match the participant's actual one, found live: `daml sandbox`
// defaults to "sandbox" (why this worked untested for so long), but Canton
// participants default their ledger id to the PARTICIPANT's own name (e.g.
// auth-proof/canton.conf's "p1") — never actually "sandbox" outside the
// bundled dev sandbox. A hardcoded default would silently break on any
// real deployment.
export const LEDGER_ID = process.env.LEDGER_ID ?? "sandbox";
export const APPLICATION_ID = "kyd-tix-app";

export interface TokenGrant {
  actAs: string[];
  readAs?: string[];
  expiresInSeconds: number;
}

// A real RS256-signed ledger access token: standard OAuth2 claims
// (iss/aud/sub/exp) a relying party verifies against our JWKS, carrying the
// Daml "custom claims" grant (actAs/readAs) that authorizes ledger actions.
// Unlike the sandbox's unsigned dev tokens (app/src/api.ts's old
// `sandboxToken`), a holder cannot mint a new one for a different party —
// they never touch the private key, only ever receive a token this server
// chose to issue for the specific grant it decided to give them.
export async function issueLedgerToken(subject: string, grant: TokenGrant): Promise<string> {
  const { privateKey, kid } = await keySet();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    "https://daml.com/ledger-api": {
      ledgerId: LEDGER_ID,
      applicationId: APPLICATION_ID,
      actAs: grant.actAs,
      readAs: grant.readAs ?? [],
    },
  })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(subject)
    .setIssuedAt(now)
    .setExpirationTime(now + grant.expiresInSeconds)
    .sign(privateKey);
}

// A wildcard-authority token — NOT exposed via any HTTP route. Used only by
// one-off ledger-setup tooling (server/auth-proof/mint-admin-token.ts) for
// package/party management (DAR upload, party allocation) against a
// participant that now requires auth for every ledger-api call.
//
// `sub` MUST be `participant_admin` — the well-known default user every
// Canton participant provisions at boot with ParticipantAdmin rights. Found
// live, the hard way, on a real jwt-rs-256-jwks-configured participant:
//   - Omitting `sub` entirely fails token PARSING outright ("Could not read
//     value for sub") — there is no sub-less admin-claims path.
//   - `sub` set to anything else (even with `admin: true` alongside it)
//     fails authorization with UserNotFound — every token's `sub` is looked
//     up as a Daml participant User, unconditionally.
//   - `participant_admin` IS a real, pre-provisioned User, so its
//     ParticipantAdmin rights are what actually authorize DAR upload and
//     party allocation here — `admin: true` in the ledger-api claims blob
//     is not, on its own, load-bearing on this participant/SDK version.
// See server/README.md for what this means for the rest of this server's
// token model (which issues plain actAs/readAs claims, not user-scoped
// tokens) — a real, scoped follow-up, not yet closed.
export async function issueAdminToken(expiresInSeconds: number): Promise<string> {
  const { privateKey, kid } = await keySet();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    "https://daml.com/ledger-api": {
      ledgerId: LEDGER_ID,
      applicationId: APPLICATION_ID,
      admin: true,
    },
  })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject("participant_admin")
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(privateKey);
}
