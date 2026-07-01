// The actual proof: Canton's own ledger-api — configured with a
// `jwt-rs-256-jwks` auth-service pointed at this server's JWKS — genuinely
// verifies these RS256 tokens' signatures and genuinely gates on real
// identity, not just this server's own app-level logic.
//
// The scope here is deliberately narrower than "any logged-in fan's token
// works end to end": that was the original goal, but running the proof
// live surfaced a real fact about this SDK/participant version that
// changes the plan — see server/README.md's "What's proven vs documented"
// table and tokens.ts's issueAdminToken doc comment. This proves the part
// that IS true: the admin token (correctly naming the real, provisioned
// `participant_admin` user) is accepted for real ledger operations, and
// every way to get a token wrong — wrong signing key, tampered payload, no
// token, or a `sub` that doesn't correspond to any provisioned user — is
// independently rejected BY CANTON ITSELF.
import { readFile } from "node:fs/promises";
import { SignJWT, generateKeyPair } from "jose";
import { keySet } from "../src/keys.js";

const JSON_API_BASE = "http://localhost:7576";
const ISSUER = "https://auth.kyd-tix.example/";
const AUDIENCE = "https://kyd-tix-ledger/";

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

  console.log("1/5  the admin token (sub=participant_admin, a real provisioned user) is ACCEPTED");
  const okRes = await allocateParty(adminToken, "ProofParty");
  const okBody = (await okRes.json()) as { result?: { identifier: string }; errors?: unknown };
  if (okRes.status !== 200) throw new Error(`expected 200, got ${okRes.status}: ${JSON.stringify(okBody)}`);
  console.log(`     status=${okRes.status} allocated=${okBody.result?.identifier} — PASS`);

  console.log("2/5  a token forged with a DIFFERENT key is REJECTED");
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

  console.log("3/5  a real admin token with a bit-flipped payload is REJECTED");
  const parts = adminToken.split(".");
  const tamperedPayload = parts[1].slice(0, -1) + (parts[1].endsWith("A") ? "B" : "A");
  const tampered = [parts[0], tamperedPayload, parts[2]].join(".");
  assertRejected((await allocateParty(tampered, "ShouldNotExist2")).status, "tampered token");

  console.log("4/5  no token at all is REJECTED");
  const noTokenRes = await fetch(`${JSON_API_BASE}/v1/parties/allocate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifierHint: "ShouldNotExist3" }),
  });
  assertRejected(noTokenRes.status, "unauthenticated request");

  console.log("5/5  a validly signed token naming a `sub` with no provisioned rights is REJECTED");
  const { privateKey, kid } = await keySet();
  const unknownUser = await new SignJWT({
    "https://daml.com/ledger-api": { ledgerId: "sandbox", applicationId: "kyd-tix-app", admin: true },
  })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject("not-a-real-user")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);
  assertRejected((await allocateParty(unknownUser, "ShouldNotExist4")).status, "unprovisioned-user token");

  console.log(
    "\nPASS — Canton's own jwt-rs-256-jwks auth-service verifies signatures AND gates on real identity, end to end",
  );
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
