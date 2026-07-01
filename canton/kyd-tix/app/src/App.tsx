import { useEffect, useState } from "react";
import type Ledger from "@daml/ledger";
import {
  DEMO_MODE,
  DemoParties,
  ROLES,
  RoleKey,
  fmtMoney,
  loadDemoParties,
  useBalance,
  useCatalog,
  useSession,
} from "./api";
import { ToastProvider } from "./Toast";
import { track } from "./analytics";
import {
  ConnectedWallet,
  abbreviateParty,
  clearPersistedWallet,
  loadPersistedWallet,
  persistWallet,
} from "./wallet";
import Logo from "./Logo";
import NotificationsBell from "./components/NotificationsBell";
import WalletConnect from "./components/WalletConnect";
import EventsView from "./components/EventsView";
import TicketsView from "./components/TicketsView";
import DoorView from "./components/DoorView";
import VenueView from "./components/VenueView";
import ArtistView from "./components/ArtistView";
import WalletSheet from "./components/WalletSheet";

type Tab = "discover" | "tickets" | "door" | "dashboard" | "royalties";

const TABS: Record<string, { key: Tab; label: string }[]> = {
  fan: [
    { key: "discover", label: "Discover" },
    { key: "tickets", label: "My Tickets" },
  ],
  venue: [
    { key: "door", label: "Door" },
    { key: "dashboard", label: "Dashboard" },
  ],
  artist: [{ key: "royalties", label: "Royalties" }],
};

function partyFor(parties: DemoParties, role: RoleKey): string {
  switch (role) {
    case "alice":
      return parties.alice;
    case "bob":
      return parties.bob;
    case "venue":
      return parties.venue;
    case "artist":
      return parties.artist;
  }
}

function Boot({ error }: { error: boolean }) {
  return (
    <div className="boot">
      <div className="boot-card">
        <Logo size="xl" tagline />
        {error ? (
          <>
            <p>The local stack isn't running yet.</p>
            <pre>
              integration/run-local.sh{"\n"}cd app && npm run dev
            </pre>
          </>
        ) : (
          <p className="muted">Connecting…</p>
        )}
      </div>
    </div>
  );
}

function FanShell({
  parties,
  role,
  party,
  fanToken,
  ledger,
  tab,
  setTab,
}: {
  parties: DemoParties;
  role: RoleKey;
  party: string;
  fanToken: string;
  ledger: Ledger;
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const catalog = useCatalog();
  const balance = useBalance(ledger, party);
  const [walletOpen, setWalletOpen] = useState(false);

  const otherFans = ROLES.filter((r) => r.kind === "fan" && r.key !== role).map((r) => ({
    party: partyFor(parties, r.key),
    label: r.label.split(" — ")[0],
  }));

  return (
    <>
      <button className="wallet-chip" onClick={() => setWalletOpen(true)}>
        {fmtMoney(balance)} <span className="plus">＋</span>
      </button>
      {walletOpen && (
        <WalletSheet fanToken={fanToken} balance={balance} onClose={() => setWalletOpen(false)} />
      )}
      <main>
        {tab === "discover" && (
          <EventsView
            events={catalog.events}
            allocs={catalog.allocs}
            fanLedger={ledger}
            fan={party}
            parties={parties}
            balance={balance}
            onNeedFunds={() => setWalletOpen(true)}
            onPurchased={() => setTab("tickets")}
          />
        )}
        {tab === "tickets" && (
          <TicketsView events={catalog.events} fanLedger={ledger} fan={party} otherFans={otherFans} />
        )}
      </main>
    </>
  );
}

export default function App() {
  const [parties, setParties] = useState<DemoParties | null>(null);
  const [bootError, setBootError] = useState(false);
  const [role, setRole] = useState<RoleKey>("alice");
  const [tab, setTab] = useState<Tab>("discover");
  const [menuOpen, setMenuOpen] = useState(false);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [walletConnectOpen, setWalletConnectOpen] = useState(false);

  useEffect(() => {
    track("app_open");
    setWallet(loadPersistedWallet());
    loadDemoParties()
      .then(setParties)
      .catch(() => setBootError(true));
  }, []);

  const connectWalletState = (w: ConnectedWallet) => {
    persistWallet(w);
    setWallet(w);
  };
  const disconnectWallet = () => {
    clearPersistedWallet();
    setWallet(null);
    setWalletConnectOpen(false);
    track("wallet_disconnected");
  };

  const roleInfo = ROLES.find((r) => r.key === role)!;
  // Real per-role login (server/src/identity.ts issues a signed token for
  // exactly this role) rather than the browser forging its own.
  const { session, ledger } = useSession(parties ? role : null);

  if (!parties || !ledger || !session) return <Boot error={bootError} />;
  const party = session.party;

  const switchRole = (r: RoleKey) => {
    setRole(r);
    setMenuOpen(false);
    setTab(TABS[ROLES.find((x) => x.key === r)!.kind][0].key);
  };

  return (
    <ToastProvider>
      <div className="shell">
        <header>
          <div className="brand">
            <Logo />
            {DEMO_MODE && (
              <span className="demo-badge" title="Simulated in your browser — no live Canton ledger behind this deploy">
                demo
              </span>
            )}
          </div>
          <nav className="tabs">
            {TABS[roleInfo.kind].map((t) => (
              <button
                key={t.key}
                className={`tab ${tab === t.key ? "active" : ""}`}
                onClick={() => {
                  setTab(t.key);
                  track("tab_switched", { tab: t.key });
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="header-right">
            {roleInfo.kind === "fan" ? null : (
              <span className="muted small">{roleInfo.label}</span>
            )}
            <button
              className={`wc-chip ${wallet ? "live" : "connect"}`}
              onClick={() => {
                setWalletConnectOpen(true);
                track("wallet_connect_opened", { connected: !!wallet });
              }}
              title={wallet ? "Your connected Canton wallet" : "Connect a Canton wallet"}
            >
              {wallet ? (
                <>
                  <span className="wc-dot" />
                  <span className="wc-chip-party">{abbreviateParty(wallet.party).split("::")[0]}</span>
                </>
              ) : (
                <>
                  <span className="wc-plug">⚭</span>
                  <span className="wc-chip-label">Connect wallet</span>
                </>
              )}
            </button>
            <NotificationsBell key={party} session={session} />
            <div className="avatar-wrap">
              <button className="avatar" onClick={() => setMenuOpen((o) => !o)}>
                {roleInfo.short}
              </button>
              {menuOpen && (
                <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                  <div className="menu-label">Demo — switch identity</div>
                  {ROLES.map((r) => (
                    <button
                      key={r.key}
                      className={`menu-item ${r.key === role ? "active" : ""}`}
                      onClick={() => switchRole(r.key)}
                    >
                      <span className="avatar sm">{r.short}</span> {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {roleInfo.kind === "fan" ? (
          <FanShell
            parties={parties}
            role={role}
            party={party}
            fanToken={session.token}
            ledger={ledger}
            tab={tab}
            setTab={setTab}
          />
        ) : (
          <main>
            {tab === "door" && <DoorView venueLedger={ledger} />}
            {tab === "dashboard" && <VenueView venueLedger={ledger} venue={party} />}
            {tab === "royalties" && <ArtistView artistLedger={ledger} artist={party} />}
          </main>
        )}

        {walletConnectOpen && (
          <WalletConnect
            wallet={wallet}
            onConnected={connectWalletState}
            onDisconnect={disconnectWallet}
            onClose={() => setWalletConnectOpen(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
