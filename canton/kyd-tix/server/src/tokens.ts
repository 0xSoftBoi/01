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
export const LEDGER_ID = "sandbox";
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
