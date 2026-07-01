import { randomUUID } from "node:crypto";
import { exportJWK, generateKeyPair, type KeyLike, type JWK } from "jose";

export interface KeySet {
  kid: string;
  privateKey: KeyLike;
  publicJwk: JWK;
}

let cached: Promise<KeySet> | null = null;

// A fresh RS256 keypair, generated once per process and held only in memory.
// In production this is the identity provider's signing key — rotated on its
// own schedule, published at its own /.well-known/jwks.json — and the
// participant/JSON API never sees the private half, only ever fetches the
// public JWKS to verify a token's signature. That split is the whole point:
// nothing that can read this process's memory should be reachable from the
// browser (see auth.ts / AUDIT.md production gap #1).
export function keySet(): Promise<KeySet> {
  if (!cached) {
    cached = (async () => {
      const { publicKey, privateKey } = await generateKeyPair("RS256", { modulusLength: 2048 });
      const kid = randomUUID();
      const publicJwk = await exportJWK(publicKey);
      return { kid, privateKey, publicJwk: { ...publicJwk, kid, alg: "RS256", use: "sig" } };
    })();
  }
  return cached;
}
