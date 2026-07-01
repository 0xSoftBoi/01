import { describe, expect, it, afterAll } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { jwksRouter } from "../src/jwks.js";
import { keySet } from "../src/keys.js";
import { AUDIENCE, ISSUER, issueLedgerToken } from "../src/tokens.js";

// This is the strongest proof in the suite: a real HTTP server, a real
// network fetch of /.well-known/jwks.json (the exact endpoint Canton's
// `jwt-rs-256-jwks` auth-service would be pointed at), and a signature check
// performed entirely from that fetched public key — no shared in-process
// object between signer and verifier.
async function startServer(): Promise<{ server: Server; baseUrl: string }> {
  const app = express();
  app.use(jwksRouter);
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

describe("GET /.well-known/jwks.json", () => {
  let server: Server;

  afterAll(() => {
    server?.close();
  });

  it("serves the same public key issueLedgerToken signs with, verifiable over real HTTP", async () => {
    const started = await startServer();
    server = started.server;

    const res = await fetch(`${started.baseUrl}/.well-known/jwks.json`);
    expect(res.status).toBe(200);
    const jwksBody = (await res.json()) as { keys: { kid: string }[] };
    expect(jwksBody.keys).toHaveLength(1);

    const { kid } = await keySet();
    expect(jwksBody.keys[0].kid).toBe(kid);

    const token = await issueLedgerToken("bob::ef01", { actAs: ["bob::ef01"], expiresInSeconds: 300 });
    const remoteJwks = createRemoteJWKSet(new URL(`${started.baseUrl}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, remoteJwks, { issuer: ISSUER, audience: AUDIENCE });
    expect(payload.sub).toBe("bob::ef01");
  });
});
