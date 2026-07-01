// The actual proof: Canton's own ledger-api — configured with a
// `jwt-rs-256-jwks` auth-service pointed at this server's JWKS — genuinely
// verifies these RS256 tokens' signatures and genuinely gates on real
// identity, not just this server's own app-level logic. And (step 6):
// server/src/userManagement.ts's fix actually closes the gap the first
// version of this proof found — a REAL fan login through this server's own
// /auth/login now works end to end against that same real participant, not
// just admin-scoped operations.
import { readFile } from "node:fs/promises";
import { SignJWT, generateKeyPair } from "jose";
import { ISSUER, AUDIENCE, issueAdminToken } from "../src/tokens.js";

const AUTH_BASE = "http://localhost:4001";
const JSON_API_BASE = "http://localhost:7576";

async function allocateParty(token: string, hint: string): Promise<Response> {
  return fetch(`${JSON_API_BASE}/v1/parties/allocate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ identifierHint: hint }),
  });
}

function assertRejected(status: number, label: string) {
  if (status === 200) throw new Error(`${label}: expected Canton to reject this, but it returned 200`);
  console.log(`     status=${status} — PASS (rejected)`);
}

async function main() {
  const adminToken = (await readFile("/tmp/kyd-auth-proof/admin.jwt", "utf8")).trim();

  console.log("1/6  the admin token (sub=participant_admin, a real provisioned user) is ACCEPTED");
  const okRes = await allocateParty(adminToken, "ProofParty");
  const okBody = (await okRes.json()) as { result?: { identifier: string }; errors?: unknown };
  if (okRes.status !== 200) throw new Error(`expected 200, got ${okRes.status}: ${JSON.stringify(okBody)}`);
  console.log(`     status=${okRes.status} allocated=${okBody.result?.identifier} — PASS`);

  console.log("2/6  a token forged with a DIFFERENT key is REJECTED");
  const { privateKey: foreignKey } = await generateKeyPair("RS256");
  const now = Math.floor(Date.now() / 1000);
  const forged = await new SignJWT({
    "https://daml.com/ledger-api": { ledgerId: "sandbox", applicationId: "kyd-tix-app", admin: true },
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject("participant_admin")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(foreignKey);
  assertRejected((await allocateParty(forged, "ShouldNotExist1")).status, "forged-key token");

  console.log("3/6  a real admin token with a bit-flipped payload is REJECTED");
  const parts = adminToken.split(".");
  const tamperedPayload = parts[1].slice(0, -1) + (parts[1].endsWith("A") ? "B" : "A");
  const tampered = [parts[0], tamperedPayload, parts[2]].join(".");
  assertRejected((await allocateParty(tampered, "ShouldNotExist2")).status, "tampered token");

  console.log("4/6  no token at all is REJECTED");
  const noTokenRes = await fetch(`${JSON_API_BASE}/v1/parties/allocate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifierHint: "ShouldNotExist3" }),
  });
  assertRejected(noTokenRes.status, "unauthenticated request");

  console.log("5/6  a validly signed token naming a `sub` with no provisioned rights is REJECTED");
  const unknownUser = await issueAdminToken(300, "not-a-real-user");
  assertRejected((await allocateParty(unknownUser, "ShouldNotExist4")).status, "unprovisioned-user token");

  console.log("6/6  a REAL fan login (server/src/identity.ts + userManagement.ts) works end to end");
  const loginRes = await fetch(`${AUTH_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ partyKey: "alice" }),
  });
  const loginBody = (await loginRes.json()) as { token?: string; party?: string; error?: string };
  if (loginRes.status !== 200 || !loginBody.token) {
    throw new Error(`login failed: ${loginRes.status} ${JSON.stringify(loginBody)}`);
  }
  // This is the call the original version of this proof couldn't make
  // succeed: a plain actAs/readAs login token, presented to the real
  // ledger-api, for an ordinary command (not an admin-scoped one).
  const queryRes = await fetch(`${JSON_API_BASE}/v1/query`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${loginBody.token}` },
    body: JSON.stringify({ templateIds: ["#kyd-tix:Kyd.Cash:Cash"] }),
  });
  const queryBody = (await queryRes.json()) as { result?: unknown[]; errors?: unknown };
  if (queryRes.status !== 200) {
    throw new Error(`fan query rejected: ${queryRes.status} ${JSON.stringify(queryBody)}`);
  }
  console.log(
    `     logged in as ${loginBody.party}, queried Cash: status=${queryRes.status} notes=${queryBody.result?.length ?? 0} — PASS`,
  );

  console.log(
    "\nPASS — Canton's own jwt-rs-256-jwks auth-service verifies signatures, gates on real identity, AND a real fan login works end to end",
  );
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
