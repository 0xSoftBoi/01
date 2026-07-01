// Ledger access layer. The UX premise (KYD's actual value-add) is that fans
// never see crypto mechanics: parties are hosted on the operator's validator,
// "logging in" is picking an identity (in production: phone/email + JWT from
// the auth provider), money is a balance with a card on-ramp, buying is one
// tap. Everything in this file exists to keep that abstraction airtight.
import { useEffect, useMemo, useState } from "react";
import Ledger from "@daml/ledger";
import type { ContractId, Template } from "@daml/types";
import { Cash } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Cash";
import { Event, PurchaseOrder, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";

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

export const ROLES: { key: RoleKey; label: string; short: string; kind: "fan" | "venue" | "artist" }[] = [
  { key: "alice", label: "Alice — fan", short: "A", kind: "fan" },
  { key: "bob", label: "Bob — fan", short: "B", kind: "fan" },
  { key: "venue", label: "Brooklyn Bowl — venue", short: "BB", kind: "venue" },
  { key: "artist", label: "Robert Plant — artist", short: "RP", kind: "artist" },
];

export async function loadDemoParties(): Promise<DemoParties> {
  const res = await fetch("/demo-parties.json");
  if (!res.ok) throw new Error("stack-not-running");
  return (await res.json()) as DemoParties;
}

// ---------------------------------------------------------------------------
// Session: a real, server-issued, RS256-signed token — see server/src/*.
// "Logging in" as a demo role now genuinely exchanges that role for a
// short-lived credential minted by the server (which holds the only signing
// key), instead of the browser forging its own unsigned token for whichever
// party it likes. The server's `loginable` map (server/src/identity.ts) never
// includes the operator, so this call can never hand back operator authority.

export interface Session {
  token: string;
  party: string;
}

async function login(partyKey: RoleKey): Promise<Session> {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ partyKey }),
  });
  if (!res.ok) throw new Error("login failed");
  return (await res.json()) as Session;
}

function ledgerFromToken(token: string): Ledger {
  return new Ledger({ token, httpBaseUrl: `${window.location.origin}/` });
}

// Re-logs in whenever the selected role changes (switching identity in the
// demo == a fresh login). Returns null while the exchange is in flight.
export function useSession(partyKey: RoleKey | null): { session: Session | null; ledger: Ledger | null } {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!partyKey) {
      setSession(null);
      return;
    }
    let live = true;
    setSession(null);
    login(partyKey)
      .then((s) => {
        if (live) setSession(s);
      })
      .catch(() => {
        if (live) setSession(null);
      });
    return () => {
      live = false;
    };
  }, [partyKey]);
  const ledger = useMemo(() => (session ? ledgerFromToken(session.token) : null), [session]);
  return { session, ledger };
}

// ---------------------------------------------------------------------------
// Polling query hook. 800ms keeps the buy -> pass -> door loop feeling live
// (production swaps this for the JSON API's WebSocket streams).

export interface QueryResult<T extends object> {
  contracts: { contractId: string; payload: T }[];
  loading: boolean;
}

export function useQuery<T extends object, K>(
  ledger: Ledger,
  template: Template<T, K, string>,
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
    const t = setInterval(fetchOnce, 800);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [ledger, template]);
  return { contracts, loading };
}

// Public catalog reads, proxied through the server's own operator session
// (server/src/catalog.ts) instead of the browser holding an operator-scoped
// Ledger. Same polling shape as useQuery so the views barely change.
export interface CatalogResult {
  events: QueryResult<Event>;
  allocs: QueryResult<TierAllocation>;
}

interface CatalogResponse {
  events: QueryResult<Event>["contracts"];
  allocs: QueryResult<TierAllocation>["contracts"];
}

export function useCatalog(): CatalogResult {
  const [events, setEvents] = useState<QueryResult<Event>["contracts"]>([]);
  const [allocs, setAllocs] = useState<QueryResult<TierAllocation>["contracts"]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    const fetchOnce = async () => {
      try {
        const res = await fetch("/catalog");
        if (!res.ok) return;
        const body = (await res.json()) as CatalogResponse;
        if (live) {
          setEvents(body.events);
          setAllocs(body.allocs);
          setLoading(false);
        }
      } catch {
        // keep last good state; the stack may still be booting
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, 800);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return { events: { contracts: events, loading }, allocs: { contracts: allocs, loading } };
}

// ---------------------------------------------------------------------------
// Money. Daml Decimals arrive as strings; the fan just sees dollars.

export function fmtMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export function shortParty(party: string): string {
  return party.split("::")[0];
}

// Spendable balance: notes the party owns that are not locked (a locked note
// is reserved in place by the registry for an in-flight allocation).
export function useBalance(ledger: Ledger, party: string): number {
  const { contracts } = useQuery(ledger, Cash);
  return useMemo(
    () =>
      contracts
        .filter((c) => c.payload.owner === party && c.payload.lock === null)
        .reduce((acc, c) => acc + Number(c.payload.amount), 0),
    [contracts, party],
  );
}

// The fan's open orders = passes still materializing.
export function usePendingOrders(ledger: Ledger, fan: string) {
  const { contracts } = useQuery(ledger, PurchaseOrder);
  return contracts.filter((c) => c.payload.fan === fan);
}

// Card on-ramp: calls the server's customer-facing top-up endpoint with the
// fan's OWN session token (server/src/payments.ts) — the mint itself only
// ever happens inside processPspWebhook after a real HMAC signature check
// (server/src/psp.ts). No operator credential is reachable from here.
export async function topUp(fanToken: string, amount: number): Promise<void> {
  const res = await fetch("/payments/topup", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${fanToken}` },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error("top-up failed");
}

// Find (or carve) a note of exactly `amount` from the party's balance —
// wallet plumbing a fan never sees.
export async function exactNote(
  ledger: Ledger,
  party: string,
  amount: number,
): Promise<ContractId<Cash>> {
  const notes = await ledger.query(Cash);
  const mine = notes
    .filter((c) => c.payload.owner === party && c.payload.lock === null)
    .sort((a, b) => Number(a.payload.amount) - Number(b.payload.amount));
  const exact = mine.find((c) => Number(c.payload.amount) === amount);
  if (exact) return exact.contractId;
  const big = mine.find((c) => Number(c.payload.amount) > amount);
  if (!big) {
    // Consolidate: several smaller notes may cover it.
    const total = mine.reduce((acc, c) => acc + Number(c.payload.amount), 0);
    if (total < amount) throw new Error("INSUFFICIENT_FUNDS");
    let [head, ...rest] = mine;
    let headCid = head.contractId;
    let headAmt = Number(head.payload.amount);
    for (const note of rest) {
      if (headAmt >= amount) break;
      const [merged] = await ledger.exercise(Cash.Cash_Merge, headCid, {
        otherCid: note.contractId,
      });
      headCid = merged as ContractId<Cash>;
      headAmt += Number(note.payload.amount);
    }
    if (headAmt === amount) return headCid;
    const [result] = await ledger.exercise(Cash.Cash_Split, headCid, {
      splitAmount: amount.toFixed(10),
    });
    return (result as { _1: ContractId<Cash>; _2: ContractId<Cash> })._2;
  }
  const [result] = await ledger.exercise(Cash.Cash_Split, big.contractId, {
    splitAmount: amount.toFixed(10),
  });
  return (result as { _1: ContractId<Cash>; _2: ContractId<Cash> })._2;
}

// One-tap purchase: carve the exact payment and sign a purchase order. The
// operator's autoFillOrders trigger does the rest; the pass materializes in
// My Tickets when the atomic fill commits.
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

// Deterministic cover art: event id -> a stable gradient hue pair.
export function coverHues(seed: string): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return [h, (h + 50) % 360];
}
