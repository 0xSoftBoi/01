// @daml/ledger's httpBaseUrl needs a trailing slash. Shared by ledgerSession.ts
// and userManagement.ts, which both construct a Ledger client from a base URL.
export function normalizeBaseUrl(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}
