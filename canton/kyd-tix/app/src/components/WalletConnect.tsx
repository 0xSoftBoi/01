// The Canton wallet connection surface. One bottom sheet, three faces:
//   • picker      — choose a token-standard wallet (not connected)
//   • connecting  — the disclosure/discovery handshake plays out step by step
//   • connected   — linked party + its CIP-56 holdings, with disconnect
// Purely additive to the app's custodial balance: linking a wallet surfaces
// self-custody holdings, it does not reroute the demo's purchase path.
import { useEffect, useState } from "react";
import {
  CONNECT_STEPS,
  ConnectedWallet,
  WALLET_PROVIDERS,
  WalletProvider,
  WalletUnavailableError,
  abbreviateParty,
  connectWallet,
  fmtHolding,
} from "../wallet";
import { track } from "../analytics";
import { useToast } from "../Toast";

interface Props {
  wallet: ConnectedWallet | null;
  onConnected: (w: ConnectedWallet) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

type Phase =
  | { kind: "picker" }
  | { kind: "connecting"; provider: WalletProvider; step: number }
  | { kind: "unavailable" };

function ProviderTile({ p, onPick }: { p: WalletProvider; onPick: () => void }) {
  return (
    <button className="wc-provider" onClick={onPick}>
      <span className="wc-glyph" style={{ background: `hsl(${p.hue} 70% 96%)`, color: `hsl(${p.hue} 65% 42%)` }}>
        {p.glyph}
      </span>
      <span className="wc-provider-text">
        <span className="wc-provider-name">{p.name}</span>
        <span className="muted small">{p.blurb}</span>
      </span>
      <span className="wc-cip">CIP-56</span>
    </button>
  );
}

function copy(text: string, toast: (k: "ok" | "err", m: string) => void) {
  navigator.clipboard?.writeText(text).then(
    () => toast("ok", "Party id copied"),
    () => toast("err", "Couldn't copy"),
  );
}

function ConnectedPanel({ wallet, onDisconnect }: { wallet: ConnectedWallet; onDisconnect: () => void }) {
  const toast = useToast();
  return (
    <>
      <div className="row spread wc-connected-head">
        <div className="row" style={{ gap: 10 }}>
          <span className="wc-dot" />
          <div>
            <div className="wc-provider-name">{wallet.providerName}</div>
            <div className="muted small">Connected · self-custody</div>
          </div>
        </div>
        <button className="ghost small-btn" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>

      <button className="wc-party" onClick={() => copy(wallet.party, toast)} title="Copy full party id">
        <span className="wc-party-label muted small">Canton party</span>
        <span className="wc-party-id">{abbreviateParty(wallet.party)}</span>
        <span className="wc-copy">copy</span>
      </button>

      <h4>Holdings</h4>
      <div className="wc-holdings">
        {wallet.holdings.map((h, i) => (
          <div className="wc-holding" key={`${h.symbol}-${i}`}>
            <div className="wc-holding-main">
              <span className="wc-holding-amt">{fmtHolding(h)}</span>
              {h.locked && <span className="wc-lock" title="Reserved in place by the registry (CIP-56 lock)">locked</span>}
            </div>
            <span className="muted small wc-holding-admin">admin {h.instrument.admin.split("::")[0]}</span>
          </div>
        ))}
      </div>
      <p className="muted small">
        Balances are read straight from the token standard's <code>Holding</code> interface — the same one Canton Coin and
        USDCx expose. In this demo, ticket purchases still settle from your KYD balance; a connected wallet can settle
        resales peer-to-peer via CIP-56 delivery-vs-payment.
      </p>
    </>
  );
}

export default function WalletConnect({ wallet, onConnected, onDisconnect, onClose }: Props) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>({ kind: "picker" });

  // Drive the connecting animation: advance a step every ~460ms while the
  // (simulated) handshake runs, then resolve to the connected state.
  useEffect(() => {
    if (phase.kind !== "connecting") return;
    let live = true;
    const timer = setInterval(() => {
      if (!live) return;
      setPhase((p) => (p.kind === "connecting" && p.step < CONNECT_STEPS.length - 1 ? { ...p, step: p.step + 1 } : p));
    }, 460);
    connectWallet(phase.provider.id)
      .then((w) => {
        if (!live) return;
        track("wallet_connected", { provider: w.providerId });
        toast("ok", `${w.providerName} connected`);
        onConnected(w);
      })
      .catch((err) => {
        if (!live) return;
        if (err instanceof WalletUnavailableError) setPhase({ kind: "unavailable" });
        else {
          toast("err", "Connection failed");
          setPhase({ kind: "picker" });
        }
      });
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [phase, onConnected, toast]);

  const pick = (provider: WalletProvider) => {
    track("wallet_connect_provider", { provider: provider.id });
    setPhase({ kind: "connecting", provider, step: 0 });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />

        {wallet ? (
          <>
            <h3>Your Canton wallet</h3>
            <ConnectedPanel wallet={wallet} onDisconnect={onDisconnect} />
          </>
        ) : phase.kind === "connecting" ? (
          <>
            <h3>Connecting {phase.provider.name}</h3>
            <div className="wc-connecting">
              <span
                className="wc-glyph big spin"
                style={{ background: `hsl(${phase.provider.hue} 70% 96%)`, color: `hsl(${phase.provider.hue} 65% 42%)` }}
              >
                {phase.provider.glyph}
              </span>
              <ul className="wc-steps">
                {CONNECT_STEPS.map((label, i) => (
                  <li key={i} className={i < phase.step ? "done" : i === phase.step ? "active" : ""}>
                    <span className="wc-step-mark">{i < phase.step ? "✓" : i === phase.step ? "•" : ""}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <button className="ghost wide" onClick={() => setPhase({ kind: "picker" })}>
              Cancel
            </button>
          </>
        ) : phase.kind === "unavailable" ? (
          <>
            <h3>Wallet bridge unavailable</h3>
            <p className="muted">
              This build has no Canton wallet bridge to connect to. Against a live participant, selecting a wallet
              performs a party-disclosure handshake and reads your balances through the CIP-56 <code>Holding</code>{" "}
              interface — no keys ever leave the wallet.
            </p>
            <button className="ghost wide" onClick={() => setPhase({ kind: "picker" })}>
              Back
            </button>
          </>
        ) : (
          <>
            <h3>Connect a Canton wallet</h3>
            <p className="muted small">
              Link a self-custody wallet to bring your own on-ledger balances. KYD never holds your keys.
            </p>
            <div className="wc-providers">
              {WALLET_PROVIDERS.map((p) => (
                <ProviderTile key={p.id} p={p} onPick={() => pick(p)} />
              ))}
            </div>
            <p className="muted small wc-foot">
              All three speak the CIP-56 token standard, so KYD reads them through one interface. Prefer to keep it
              simple? Close this and keep using your hosted KYD balance.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
