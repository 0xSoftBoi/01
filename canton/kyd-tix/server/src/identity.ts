import { Router } from "express";
import { issueLedgerToken } from "./tokens.js";
import type { DemoParties } from "./demoParties.js";

const SESSION_SECONDS = 15 * 60;

// The identity step: in production this is a real IdP (password, passkey,
// federated OIDC) that authenticates a person and hands back which Daml
// party they're allowed to act as. This demo's identity check is "pick one
// of the seeded roles" — a stand-in for that credential check — but the
// token issuance below is the real part, and it enforces the one invariant
// that actually matters: the `loginable` map below is built WITHOUT the
// operator party, so this endpoint can never hand a browser an
// operator-scoped token, no matter what it's asked for (AUDIT.md production
// gap #1 / KYD-11's custody boundary extended to the auth layer itself).
export function authRouter(parties: DemoParties) {
  const router = Router();
  const loginable: Record<string, string> = {
    alice: parties.alice,
    bob: parties.bob,
    venue: parties.venue,
    artist: parties.artist,
  };

  router.post("/auth/login", async (req, res) => {
    const partyKey = req.body?.partyKey;
    const partyId = typeof partyKey === "string" ? loginable[partyKey] : undefined;
    if (!partyId) {
      res.status(403).json({ error: "unknown or non-loginable party" });
      return;
    }
    const token = await issueLedgerToken(partyId, {
      actAs: [partyId],
      readAs: [partyId],
      expiresInSeconds: SESSION_SECONDS,
    });
    res.json({ token, party: partyId, expiresIn: SESSION_SECONDS });
  });

  return router;
}
