// Named import, not default: @daml/ledger is CJS (`exports.Ledger = Ledger;
// exports.default = Ledger`), and the default-export interop is inconsistent
// across the loaders this package runs under (tsx at dev/runtime vs tsc
// --noEmit for type-checking) — `Ledger` is the one binding both agree on.
import { Ledger as DamlLedger } from "@daml/ledger";
import type { Template, ContractId } from "@daml/types";
import { issueLedgerToken } from "./tokens.js";
import { ensureUserForParty, userIdFor } from "./userManagement.js";
import { normalizeBaseUrl } from "./httpUtil.js";

export interface LedgerContract<T = unknown> {
  contractId: string;
  payload: T;
}

// The narrow surface catalog.ts and psp.ts actually depend on — as an
// interface, not the concrete class, so tests can pass a plain in-memory
// stub instead of standing up a real JSON API.
export interface QueryableLedger {
  query<T extends object, K, I extends string>(template: Template<T, K, I>): Promise<LedgerContract<T>[]>;
}
export interface MintableLedger {
  create<T extends object, K, I extends string>(
    template: Template<T, K, I>,
    payload: T,
  ): Promise<ContractId<T>>;
}

// A server-held ledger identity: mints its own short-lived, signed tokens and
// talks to the JSON API through the same typed `@daml/ledger` client the web
// app uses (avoids hand-rolling `<packageId>:<module>:<entity>` template-id
// strings, which this JSON API's classic /v1/query rejects unless they carry
// the exact package id). The operator party never has a token living in a
// browser — this class is the ONLY place that credential exists, which is
// what makes the catalog (catalog.ts) and PSP mint (psp.ts) routes a real
// custody boundary rather than a relabeled client-side mint.
export class LedgerSession implements QueryableLedger, MintableLedger {
  private readonly userId: string;
  private readonly httpBaseUrl: string;
  private readonly ttlSeconds = 10 * 60;
  private cachedLedger: Promise<DamlLedger> | null = null;
  private cachedIssuedAtSeconds = 0;

  constructor(
    private readonly party: string,
    jsonApiBaseUrl: string,
    userId = userIdFor("operator"),
  ) {
    this.userId = userId;
    this.httpBaseUrl = normalizeBaseUrl(jsonApiBaseUrl);
  }

  // Token AND client travel together: rebuilding the Ledger client on every
  // call was wasted work once the token underneath it hadn't actually
  // changed. Daml User provisioning (userManagement.ts) is idempotent and
  // self-caches per process, so it's cheap to await unconditionally here —
  // no separate "have I provisioned yet" flag to keep in sync.
  private ledger(): Promise<DamlLedger> {
    const nowSeconds = Date.now() / 1000;
    const stillFresh = this.cachedLedger && nowSeconds - this.cachedIssuedAtSeconds < this.ttlSeconds - 30;
    if (stillFresh) return this.cachedLedger as Promise<DamlLedger>;
    this.cachedIssuedAtSeconds = nowSeconds;
    this.cachedLedger = (async () => {
      await ensureUserForParty(this.httpBaseUrl, this.userId, this.party);
      const token = await issueLedgerToken(this.userId, {
        actAs: [this.party],
        readAs: [this.party],
        expiresInSeconds: this.ttlSeconds,
      });
      return new DamlLedger({ token, httpBaseUrl: this.httpBaseUrl });
    })();
    return this.cachedLedger;
  }

  async query<T extends object, K, I extends string>(
    template: Template<T, K, I>,
  ): Promise<LedgerContract<T>[]> {
    const ledger = await this.ledger();
    const result = await ledger.query(template);
    return result.map((c) => ({ contractId: c.contractId as string, payload: c.payload }));
  }

  async create<T extends object, K, I extends string>(
    template: Template<T, K, I>,
    payload: T,
  ): Promise<ContractId<T>> {
    const ledger = await this.ledger();
    const created = await ledger.create(template, payload);
    return created.contractId;
  }
}
