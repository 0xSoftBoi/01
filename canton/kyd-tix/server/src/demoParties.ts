import { readFileSync } from "node:fs";

// Mirrors app/src/api.ts's DemoParties — the seeded identities from
// Kyd.Demo:setup. In production this file doesn't exist; party ids come from
// the operator's own onboarding/KYC system, keyed by the real IdP's user id.
export interface DemoParties {
  operator: string;
  venue: string;
  artist: string;
  alice: string;
  bob: string;
  lender: string;
  lender2: string;
}

export function loadDemoParties(path: string): DemoParties {
  return JSON.parse(readFileSync(path, "utf8")) as DemoParties;
}
