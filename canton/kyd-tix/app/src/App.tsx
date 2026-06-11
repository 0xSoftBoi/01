import { useEffect, useMemo, useState } from "react";
import {
  DemoParties,
  ROLES,
  RoleKey,
  fmtMoney,
  ledgerFor,
  loadDemoParties,
  shortParty,
  useBalance,
} from "./api";
import EventsView from "./components/EventsView";
import TicketsView from "./components/TicketsView";
import DoorView from "./components/DoorView";
import VenueView from "./components/VenueView";
import ArtistView from "./components/ArtistView";

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

function FanBalance({ party }: { party: string }) {
  const ledger = useMemo(() => ledgerFor(party), [party]);
  const balance = useBalance(ledger, party);
  return <span className="chip">{fmtMoney(balance)}</span>;
}

export default function App() {
  const [parties, setParties] = useState<DemoParties | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [role, setRole] = useState<RoleKey>("alice");
  const [tab, setTab] = useState<Tab>("discover");

  useEffect(() => {
    loadDemoParties().then(setParties).catch((e) => setBootError(String(e)));
  }, []);

  const roleInfo = ROLES.find((r) => r.key === role)!;
  const party = parties ? partyFor(parties, role) : "";
  const ledger = useMemo(() => (party ? ledgerFor(party) : null), [party]);
  const catalog = useMemo(
    () => (parties ? ledgerFor(parties.operator) : null),
    [parties],
  );

  const switchRole = (r: RoleKey) => {
    setRole(r);
    const kind = ROLES.find((x) => x.key === r)!.kind;
    setTab(TABS[kind][0].key);
  };

  if (bootError)
    return (
      <div className="boot">
        <h1>KYD</h1>
        <p className="banner error">{bootError}</p>
      </div>
    );
  if (!parties || !ledger || !catalog) return <div className="boot">Connecting…</div>;

  const otherFans = ROLES.filter((r) => r.kind === "fan" && r.key !== role).map((r) => ({
    party: partyFor(parties, r.key),
    label: r.label,
  }));

  return (
    <div className="shell">
      <header>
        <div className="brand">
          KYD<span className="dot">.</span>
          <span className="sub">on Canton</span>
        </div>
        <div className="role-bar">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className={`pill ${r.key === role ? "active" : ""}`}
              onClick={() => switchRole(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="me">
          {roleInfo.kind === "fan" && <FanBalance party={party} />}
          <span className="muted">{shortParty(party)}</span>
        </div>
      </header>

      <nav>
        {TABS[roleInfo.kind].map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "discover" && (
          <EventsView catalog={catalog} fanLedger={ledger} fan={party} parties={parties} />
        )}
        {tab === "tickets" && (
          <TicketsView fanLedger={ledger} fan={party} otherFans={otherFans} />
        )}
        {tab === "door" && <DoorView venueLedger={ledger} />}
        {tab === "dashboard" && <VenueView venueLedger={ledger} venue={party} />}
        {tab === "royalties" && <ArtistView artistLedger={ledger} artist={party} />}
      </main>

      <footer className="muted">
        Every action above is a Daml command under the selected party's own authority; fills,
        sweeps and accrual are the operator's triggers. No wallets, no gas, no seed phrases —
        the ledger is the backend.
      </footer>
    </div>
  );
}
