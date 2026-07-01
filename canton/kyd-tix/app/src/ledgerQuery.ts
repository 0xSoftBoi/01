// The generic ledger-polling hook, split out of api.ts so both the real
// backend path and the demo mock (src/demo/mock.ts) can share it without an
// import cycle: api.ts imports the mock, and the mock needs this hook too.
import { useEffect, useState } from "react";
import Ledger from "@daml/ledger";
import type { Template } from "@daml/types";

export interface QueryResult<T extends object> {
  contracts: { contractId: string; payload: T }[];
  loading: boolean;
}

// 800ms keeps the buy -> pass -> door loop feeling live (production swaps
// this for the JSON API's WebSocket streams). `ledger` may be null while a
// caller is still resolving one asynchronously (e.g. DEMO_MODE's lazily
// -imported mock ledger) — the hook itself must still be called every
// render either way, so the "not ready yet" case is a null check inside the
// effect, not a skipped hook call.
export function useQuery<T extends object, K>(
  ledger: Ledger | null,
  template: Template<T, K, string>,
): QueryResult<T> {
  const [contracts, setContracts] = useState<{ contractId: string; payload: T }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!ledger) return;
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
