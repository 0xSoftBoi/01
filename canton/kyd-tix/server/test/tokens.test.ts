import { describe, expect, it } from "vitest";
import { createLocalJWKSet, jwtVerify } from "jose";
import { keySet } from "../src/keys.js";
import { AUDIENCE, ISSUER, issueLedgerToken } from "../src/tokens.js";

async function localJwks() {
  const { publicJwk } = await keySet();
  return createLocalJWKSet({ keys: [publicJwk] });
}

describe("issueLedgerToken", () => {
  it("issues a token that verifies against the published public key and carries the requested grant", async () => {
    const jwks = await localJwks();
    const token = await issueLedgerToken("alice::abcd", {
      actAs: ["alice::abcd"],
      readAs: ["alice::abcd"],
      expiresInSeconds: 300,
    });

    const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER, audience: AUDIENCE });
    expect(payload.sub).toBe("alice::abcd");
    expect(payload["https://daml.com/ledger-api"]).toMatchObject({
      actAs: ["alice::abcd"],
      readAs: ["alice::abcd"],
    });
  });

  it("rejects a token that has been tampered with after signing", async () => {
    const jwks = await localJwks();
    const token = await issueLedgerToken("alice::abcd", { actAs: ["alice::abcd"], expiresInSeconds: 300 });
    const parts = token.split(".");
    // Flip the last character of the payload segment — the signature no
    // longer covers what's actually there.
    const tamperedPayload = parts[1].slice(0, -1) + (parts[1].endsWith("A") ? "B" : "A");
    const tampered = [parts[0], tamperedPayload, parts[2]].join(".");
    await expect(jwtVerify(tampered, jwks, { issuer: ISSUER, audience: AUDIENCE })).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const jwks = await localJwks();
    const token = await issueLedgerToken("alice::abcd", { actAs: ["alice::abcd"], expiresInSeconds: -10 });
    await expect(jwtVerify(token, jwks, { issuer: ISSUER, audience: AUDIENCE })).rejects.toThrow(/exp/i);
  });

  it("rejects a token presented to the wrong audience", async () => {
    const jwks = await localJwks();
    const token = await issueLedgerToken("alice::abcd", { actAs: ["alice::abcd"], expiresInSeconds: 300 });
    await expect(
      jwtVerify(token, jwks, { issuer: ISSUER, audience: "https://someone-elses-ledger/" }),
    ).rejects.toThrow();
  });
});
