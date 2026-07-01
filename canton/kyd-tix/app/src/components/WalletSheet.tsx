// The wallet, made tangible: balance front and center, card on-ramp with
// preset amounts. No addresses, no tokens, no gas — money in, tickets out.
import { useState } from "react";
import { fmtMoney, topUp } from "../api";
import { useToast } from "../Toast";

interface Props {
  fanToken: string;
  balance: number;
  onClose: () => void;
}

const PRESETS = [25, 50, 100];

export default function WalletSheet({ fanToken, balance, onClose }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  const add = async (amount: number) => {
    setBusy(amount);
    try {
      await topUp(fanToken, amount);
      toast("ok", `${fmtMoney(amount)} added to your balance`);
      onClose();
    } catch {
      toast("err", "Top-up failed — is the stack running?");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <h3>Wallet</h3>
        <div className="wallet-balance">
          <span className="muted">Available balance</span>
          <div className="big-number">{fmtMoney(balance)}</div>
        </div>
        <h4>Add funds</h4>
        <div className="row">
          {PRESETS.map((a) => (
            <button
              key={a}
              className="preset"
              disabled={busy !== null}
              onClick={() => add(a)}
            >
              {busy === a ? "…" : `+$${a}`}
            </button>
          ))}
        </div>
        <p className="muted small">
          Balance is minted server-side, only after a signature-verified charge event —
          the same path a real PSP webhook (Stripe, Adyen) would trigger. This demo
          simulates the card processor; the mint code itself is the production path.
        </p>
        <button className="ghost wide" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
