import { createLocalJWKSet, jwtVerify, type JWTPayload } from "jose";
import { AUDIENCE, ISSUER } from "./tokens.js";
import { keySet } from "./keys.js";

// Verifies a bearer token exactly as a real relying party would: check the
// signature against the issuer's public key, plus issuer/audience/expiry.
// Used by this server's own fan-facing routes (e.g. payments.ts) — the
// equivalent check on the ledger side is Canton's `jwt-rs-256-jwks`
// auth-service, configured against this same process's /.well-known/jwks.json
// (see tokens.ts and integration/README.md). Local (in-process) rather than
// a self-HTTP-call to our own JWKS endpoint: test/jwks.test.ts separately
// proves that endpoint is fetchable and serves a working key over real HTTP.
export async function verifyToken(token: string): Promise<JWTPayload> {
  if (!token) throw new Error("missing token");
  const { publicJwk } = await keySet();
  const jwks = createLocalJWKSet({ keys: [publicJwk] });
  const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER, audience: AUDIENCE });
  return payload;
}
