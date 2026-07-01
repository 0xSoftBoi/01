import { Router } from "express";
import { asyncRoute } from "./asyncRoute.js";
import { issueLedgerToken } from "./tokens.js";
import { ensureUserForParty, userIdFor } from "./userManagement.js";
import type { DemoParties } from "./demoParties.js";

const SESSION_SECONDS = 15 * 60;

export type EnsureUserFn = (jsonApiBaseUrl: string, userId: string, party: string) => Promise<void>;

// The identity step: in production this is a real IdP (password, passkey,
// federated OIDC) that authenticates a person and hands back which Daml
// party they're allowed to act as. This demo's identity check is "pick one
// of the seeded roles" — a stand-in for that credential check — but the
// token issuance below is the real part, and it enforces the one invariant
// that actually matters: the `loginable` map below is built WITHOUT the
// operator party, so this endpoint can never hand a browser an
// operator-scoped token, no matter what it's asked for (AUDIT.md production
// gap #1 / KYD-11's custody boundary extended to the auth layer itself).
//
// `ensureUser` defaults to the real provisioning call (userManagement.ts)
// but is injectable so tests can stub it out instead of needing a real
// running ledger.
export function authRouter(parties: DemoParties, jsonApiBaseUrl: string, ensureUser: EnsureUserFn = ensureUserForParty) {
  const router = Router();
  const loginable: Record<string, string> = {
    alice: parties.alice,
    bob: parties.bob,
    venue: parties.venue,
    artist: parties.artist,
  };

  router.post(
    "/auth/login",
    asyncRoute(async (req, res) => {
      const partyKey = req.body?.partyKey;
      const isLoginable =
        typeof partyKey === "string" && Object.prototype.hasOwnProperty.call(loginable, partyKey);
      const partyId = isLoginable ? loginable[partyKey] : undefined;
      if (!isLoginable || typeof partyId !== "string") {
        res.status(403).json({ error: "unknown or non-loginable party" });
        return;
      }
      // Real Canton participants resolve a token's `sub` through Daml User
      // Management, unconditionally — see userManagement.ts. Idempotent, so
      // every login after the first is just a redundant-but-cheap grant.
      const userId = userIdFor(partyKey);
      await ensureUser(jsonApiBaseUrl, userId, partyId);
      const token = await issueLedgerToken(userId, {
        actAs: [partyId],
        readAs: [partyId],
        expiresInSeconds: SESSION_SECONDS,
      });
      res.json({ token, party: partyId, expiresIn: SESSION_SECONDS });
    }),
  );

  return router;
}
