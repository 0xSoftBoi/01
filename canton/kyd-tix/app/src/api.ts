// Ledger access layer. The UX premise (KYD's actual value-add) is that fans
// never see crypto mechanics: parties are hosted on the operator's validator,
// "logging in" is picking an identity (in production: phone/email + JWT from
// the auth provider), money is a balance, buying is one tap. Everything in
// this file exists to keep that abstraction airtight in the components.
import { useEffect, useMemo, useState } from "react";
import Ledger from "@daml/ledger";
import type { ContractId, Template } from "@daml/types";
import { Cash } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Cash";
import { PurchaseOrder } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";

// ---------------------------------------------------------------------------
// Demo identities

export interface DemoParties {
  operator: string;
  venue: string;
  artist: string;
  alice: string;
  bob: string;
  lender: string;
  lender2: string;
}

export type RoleKey = "alice" | "bob" | "venue" | "artist";

export const ROLES: { key: RoleKey; label: string; kind: "fan" | "venue" | "artist" }[] = [
  { key: "alice", label: "Alice (fan)", kind: "fan" },
  { key: "bob", label: "Bob (fan)", kind: "fan" },
  { key: "venue", label: "Brooklyn Bowl (venue)", kind: "venue" },
  { key: "artist", label: "Robert Plant (artist)", kind: "artist" },
];

export async function loadDemoParties(): Promise<DemoParties> {
  const res = await fetch("/demo-parties.json");
  if (!res.ok) {
    throw new Error(
      "demo-parties.json not found - start the stack with integration/run-local.sh first",
    );
  }
  return (await res.json()) as DemoParties;
}

// ---------------------------------------------------------------------------
// Sandbox tokens (local development only). The sandbox does not verify token
// signatures; in production these come from your OAuth2/OIDC provider.

function base64url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function sandboxToken(party: string, readAs: string[] = []): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    "https://daml.com/ledger-api": {
      ledgerId: "sandbox",
      applicationId: "kyd-tix-app",
      actAs: [party],
      readAs,
    },
  };
  return [base64url(JSON.stringify(header)), base64url(JSON.stringify(payload)), "kyd"].join(".");
}

export function ledgerFor(party: string): Ledger {
  return new Ledger({ token: sandboxToken(party), httpBaseUrl: `${window.location.origin}/` });
}

// ---------------------------------------------------------------------------
// Polling query hook (2s): simple, robust, and good enough for a demo UI.
// (Production would use the JSON API's WebSocket streaming endpoints.)

export interface QueryResult<T extends object> {
  contracts: { contractId: string; payload: T }[];
  loading: boolean;
}

export function useQuery<T extends object, K>(
  ledger: Ledger,
  template: Template<T, K, string>,
  refreshKey = 0,
): QueryResult<T> {
  const [contracts, setContracts] = useState<{ contractId: string; payload: T }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    const fetchOnce = async () => {
      try {
        const result = await ledger.query(template);
        if (live) {
          setContracts(
            result.map((c) => ({ contractId: c.contractId as string, payload: c.payload })),
          );
          setLoading(false);
        }
      } catch {
        // keep last good state; the stack may still be booting
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, 2000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [ledger, template, refreshKey]);
  return { contracts, loading };
}

// ---------------------------------------------------------------------------
// Money helpers. Daml Decimals arrive as strings; the fan just sees dollars.

export function fmtMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

// Party ids look like "Alice::1220abcd…"; humans see the hint.
export function shortParty(party: string): string {
  return party.split("::")[0];
}

export function useBalance(ledger: Ledger, party: string): number {
  const { contracts } = useQuery(ledger, Cash);
  return useMemo(
    () =>
      contracts
        .filter((c) => c.payload.owner === party)
        .reduce((acc, c) => acc + Number(c.payload.amount), 0),
    [contracts, party],
  );
}

// Find (or carve) a note of exactly `amount` from the party's balance.
// This is the "wallet plumbing" a fan never sees: pick a note >= amount,
// split off the exact slice if needed.
export async function exactNote(
  ledger: Ledger,
  party: string,
  amount: number,
): Promise<ContractId<Cash>> {
  const notes = await ledger.query(Cash);
  const mine = notes
    .filter((c) => c.payload.owner === party)
    .sort((a, b) => Number(a.payload.amount) - Number(b.payload.amount));
  const exact = mine.find((c) => Number(c.payload.amount) === amount);
  if (exact) return exact.contractId;
  const big = mine.find((c) => Number(c.payload.amount) > amount);
  if (!big) throw new Error("Insufficient balance");
  const [result] = await ledger.exercise(Cash.Cash_Split, big.contractId, {
    splitAmount: amount.toFixed(10),
  });
  // Cash_Split returns (kept, slice); the slice is the exact amount.
  return (result as { _1: ContractId<Cash>; _2: ContractId<Cash> })._2;
}

// One-tap purchase: carve the exact payment and sign a purchase order.
// The operator's autoFillOrders trigger does the rest; the ticket appears in
// "My Tickets" when the atomic fill commits.
export async function placeOrder(
  ledger: Ledger,
  parties: DemoParties,
  fan: string,
  eventId: string,
  tierId: string,
  price: number,
): Promise<void> {
  const cashCid = await exactNote(ledger, fan, price);
  await ledger.create(PurchaseOrder, {
    operator: parties.operator,
    venue: parties.venue,
    fan,
    eventId,
    tierId,
    cashCid,
  });
}
