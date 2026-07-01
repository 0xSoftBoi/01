import { createPrivateKey, createPublicKey, generateKeyPairSync, type KeyObject } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { calculateJwkThumbprint, exportJWK, type JWK } from "jose";

export interface KeySet {
  kid: string;
  privateKey: KeyObject;
  publicJwk: JWK;
}

let cached: Promise<KeySet> | null = null;

// SIGNING_KEY_PATH, if set, persists the private key to disk (PKCS8 PEM) and
// reloads it on the next boot instead of generating a fresh one. Two
// concerns this serves:
//   1. Production correctness: without it, restarting this process silently
//      invalidates every outstanding token, and a second replica would have
//      a DIFFERENT key entirely — neither is acceptable for a real IdP.
//   2. Cross-process proof: server/auth-proof/ mints a one-off admin token
//      in a SEPARATE short-lived process from the long-running server, to
//      seed the ledger before the server's HTTP JWKS endpoint is even up.
//      That only verifies if both processes sign with the literal same key.
// Unset (the default here and in run-local.sh), each boot gets a fresh
// ephemeral key — fine for a single-instance local demo.
function loadOrGeneratePrivateKey(): KeyObject {
  const keyPath = process.env.SIGNING_KEY_PATH;
  if (keyPath && existsSync(keyPath)) {
    return createPrivateKey(readFileSync(keyPath));
  }
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  if (keyPath) {
    writeFileSync(keyPath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  }
  return privateKey;
}

export function keySet(): Promise<KeySet> {
  if (!cached) {
    cached = (async () => {
      const privateKey = loadOrGeneratePrivateKey();
      const publicKey = createPublicKey(privateKey);
      const publicJwk = await exportJWK(publicKey);
      // A thumbprint (RFC 7638), not a random id: derived purely from the key
      // material, so two processes loading the SAME persisted key (see
      // SIGNING_KEY_PATH above) agree on the same `kid` without coordinating —
      // required for jose's kid-based JWKS lookup to find the right entry.
      const kid = await calculateJwkThumbprint(publicJwk);
      return { kid, privateKey, publicJwk: { ...publicJwk, kid, alg: "RS256", use: "sig" } };
    })();
  }
  return cached;
}
