// Canton wallet connection — the self-custody path, alongside the hosted
// custodial balance most fans use (see api.ts). A Canton wallet connect is a
// PARTY-DISCLOSURE handshake, not a seed-phrase import: the wallet tells the
// dapp which on-ledger party it acts as and shares a read grant, after which
// the dapp discovers the party's balances through the CIP-56 token standard's
// `Holding` interface (Splice.Api.Token.HoldingV1:Holding) — the exact
// interface Kyd.Cash implements and any token-standard wallet (Loop, Canton
// Coin wallets, …) reads via an InterfaceFilter. No keys ever reach KYD.
//
// In DEMO_MODE (the hosted Vercel deploy — no live participant behind it) the
// handshake is simulated deterministically per provider. Against the real
// stack there is no browser wallet bridge to talk to in this build, so connect
// reports itself unavailable rather than hanging on a dead spinner; the UX and
// the discovery model are identical either way.
import { DEMO_MODE } from "./api";

export interface WalletProvider {
  id: string;
  name: string;
  glyph: string; // a compact monogram rendered in the provider tile
  hue: number; // tile accent hue
  blurb: string;
}

// The Canton-native wallets a token-standard dapp would offer. Names match the
// real ecosystem; all three speak CIP-56, so the integration surface is one
// interface, not three bespoke SDKs.
export const WALLET_PROVIDERS: WalletProvider[] = [
  { id: "loop", name: "Loop", glyph: "L", hue: 268, blurb: "Canton Network wallet" },
  { id: "cc", name: "Canton Coin Wallet", glyph: "◈", hue: 210, blurb: "Global Synchronizer" },
  { id: "copanto", name: "Copanto", glyph: "C", hue: 158, blurb: "Browser extension" },
];

// One CIP-56 holding as the `Holding` interface view surfaces it: an amount of
// an instrument, whose id is (admin party, symbol), plus whether the registry
// currently has it locked in place.
export interface Holding {
  instrument: { admin: string; id: string };
  symbol: string;
  decimals: number;
  amount: number;
  locked: boolean;
}

export interface ConnectedWallet {
  providerId: string;
  providerName: string;
  party: string;
  holdings: Holding[];
  connectedAt: number;
}

export class WalletUnavailableError extends Error {
  constructor() {
    super("wallet-bridge-unavailable");
    this.name = "WalletUnavailableError";
  }
}

const STORAGE_KEY = "kyd.wallet.v1";

// Deterministic simulated disclosure per provider: a stable party hint and a
// seeded CIP-56 holdings set. Amounts are chosen to look like a real mixed
// treasury (KYD-USD from the operator registry, plus network-native assets).
const DEMO_WALLETS: Record<string, Omit<ConnectedWallet, "connectedAt">> = {
  loop: {
    providerId: "loop",
    providerName: "Loop",
    party: "loop-9f3a2c::demo",
    holdings: [
      { instrument: { admin: "KYD-Operator::demo", id: "KYD-USD" }, symbol: "KYD-USD", decimals: 2, amount: 250, locked: false },
      { instrument: { admin: "Global-Synchronizer::demo", id: "Amulet" }, symbol: "CC", decimals: 4, amount: 1480, locked: false },
    ],
  },
  cc: {
    providerId: "cc",
    providerName: "Canton Coin Wallet",
    party: "cc-7b1e04::demo",
    holdings: [
      { instrument: { admin: "Global-Synchronizer::demo", id: "Amulet" }, symbol: "CC", decimals: 4, amount: 3200, locked: false },
      { instrument: { admin: "Circle::demo", id: "USDC" }, symbol: "USDCx", decimals: 2, amount: 500, locked: false },
      { instrument: { admin: "KYD-Operator::demo", id: "KYD-USD" }, symbol: "KYD-USD", decimals: 2, amount: 40, locked: true },
    ],
  },
  copanto: {
    providerId: "copanto",
    providerName: "Copanto",
    party: "cpn-4d8a11::demo",
    holdings: [
      { instrument: { admin: "KYD-Operator::demo", id: "KYD-USD" }, symbol: "KYD-USD", decimals: 2, amount: 90, locked: false },
      { instrument: { admin: "Global-Synchronizer::demo", id: "Amulet" }, symbol: "CC", decimals: 4, amount: 610, locked: false },
    ],
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The steps a token-standard connect actually walks, surfaced so the connecting
// state reads like a real handshake instead of an opaque spinner.
export const CONNECT_STEPS = [
  "Requesting read grant…",
  "Resolving your Canton party…",
  "Discovering holdings via the Holding interface…",
];

// Simulated (DEMO_MODE) or unavailable (real stack) connect. The caller drives
// the per-step animation off CONNECT_STEPS; this just resolves once the
// simulated discovery would be done.
export async function connectWallet(providerId: string): Promise<ConnectedWallet> {
  if (!DEMO_MODE) throw new WalletUnavailableError();
  const seed = DEMO_WALLETS[providerId];
  if (!seed) throw new Error(`unknown provider: ${providerId}`);
  await delay(1400); // let the disclosure/discovery steps play out
  return { ...seed, connectedAt: Date.now() };
}

export function loadPersistedWallet(): ConnectedWallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const w = JSON.parse(raw) as ConnectedWallet;
    if (!w || typeof w.party !== "string" || !Array.isArray(w.holdings)) return null;
    return w;
  } catch {
    return null;
  }
}

export function persistWallet(wallet: ConnectedWallet): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
  } catch {
    // storage disabled (private mode) — the connection just won't survive reload
  }
}

export function clearPersistedWallet(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Canton party ids are `hint::fingerprint`. The hint is human-meaningful; the
// fingerprint is a long key hash, so abbreviate it (demo namespaces are short
// and shown whole).
export function abbreviateParty(party: string): string {
  const [hint, ns] = party.split("::");
  if (!ns) return hint;
  return ns.length > 12 ? `${hint}::${ns.slice(0, 6)}…${ns.slice(-4)}` : `${hint}::${ns}`;
}

export function fmtHolding(h: Holding): string {
  const n = h.amount.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, h.decimals),
    maximumFractionDigits: Math.min(2, h.decimals),
  });
  return `${n} ${h.symbol}`;
}
