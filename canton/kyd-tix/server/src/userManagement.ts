import { Ledger as DamlLedger, UserRightHelper, type UserRight } from "@daml/ledger";
import { issueAdminToken } from "./tokens.js";
import { normalizeBaseUrl } from "./httpUtil.js";

// Daml user ids disallow `::` (party ids are `hint::fingerprint`), so a
// login token's `sub` can't just be the party string. Deterministic and
// stable across restarts for a given role, so re-provisioning is a no-op.
export function userIdFor(roleKey: string): string {
  return `kyd-${roleKey}`;
}

// The narrow surface provisionUser needs — as an interface, not the
// concrete @daml/ledger client, so it's testable without a real JSON API
// (same pattern as QueryableLedger/MintableLedger in ledgerSession.ts).
export interface UserProvisioner {
  createUser(userId: string, rights: UserRight[], primaryParty?: string): Promise<void>;
  grantUserRights(userId: string, rights: UserRight[]): Promise<UserRight[]>;
}

// Idempotently ensures a Daml User named `userId` exists with CanActAs +
// CanReadAs for exactly `party`. Required because this SDK's
// jwt-rs-256-jwks auth-service resolves every token's `sub` through Daml's
// own User Management, unconditionally — a token's own actAs/readAs claims
// are not sufficient on their own once a real participant is verifying
// signatures (found live: server/auth-proof/README section "What that live
// run corrected").
export async function provisionUser(provisioner: UserProvisioner, userId: string, party: string): Promise<void> {
  const rights: UserRight[] = [UserRightHelper.canActAs(party), UserRightHelper.canReadAs(party)];
  try {
    await provisioner.createUser(userId, rights, party);
  } catch {
    // Already exists (common case: every login after the first) or a
    // transient conflict — either way, granting is idempotent: re-granting
    // an already-held right is a documented no-op, not an error.
    await provisioner.grantUserRights(userId, rights);
  }
}

// Provisioning is idempotent on the ledger, but still costs an admin-token
// mint plus one or two ledger round-trips — real cost to pay on every login
// for a user that's already provisioned. Cached per process by userId, with
// the entry evicted on failure so a transient error doesn't permanently wedge
// that party's logins.
const provisioned = new Map<string, Promise<void>>();

// The real entry point: mints a short-lived admin token (never exposed via
// any HTTP route — same principle as auth-proof's setup tooling and the
// operator credential itself) and provisions against the actual ledger.
export function ensureUserForParty(jsonApiBaseUrl: string, userId: string, party: string): Promise<void> {
  const cached = provisioned.get(userId);
  if (cached) return cached;
  const promise = (async () => {
    const token = await issueAdminToken(60);
    const ledger = new DamlLedger({ token, httpBaseUrl: normalizeBaseUrl(jsonApiBaseUrl) });
    await provisionUser(ledger, userId, party);
  })().catch((err: unknown) => {
    provisioned.delete(userId);
    throw err;
  });
  provisioned.set(userId, promise);
  return promise;
}
