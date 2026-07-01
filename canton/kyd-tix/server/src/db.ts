import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

// The server's own operational store — everything the ledger can't or
// shouldn't hold: login bookkeeping, the indexer's read model of the ACS,
// per-party notifications, anonymous funnel analytics, and webhook replay
// protection. SQLite because this server is single-process by design (it IS
// the custody boundary — see ledgerSession.ts); better-sqlite3's synchronous
// API means no torn read-modify-write between the indexer's poll and the
// HTTP routes without any locking of our own.

// Versioned via PRAGMA user_version: each entry runs at most once, in order,
// inside a transaction — reopening an already-migrated file is a no-op, and
// a future schema change is a new array entry, never an edit to an old one.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    party TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  );
  CREATE TABLE indexed_contracts (
    contract_id TEXT PRIMARY KEY,
    template TEXT NOT NULL,
    payload TEXT NOT NULL,
    first_seen_at INTEGER NOT NULL,
    archived_at INTEGER
  );
  CREATE INDEX idx_contracts_template ON indexed_contracts (template, archived_at);
  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    party TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    contract_id TEXT,
    created_at INTEGER NOT NULL,
    read_at INTEGER
  );
  CREATE INDEX idx_notifications_party ON notifications (party, read_at);
  CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    party TEXT,
    name TEXT NOT NULL,
    props TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_analytics_name ON analytics_events (name);
  CREATE TABLE webhook_deliveries (
    delivery_id TEXT PRIMARY KEY,
    received_at INTEGER NOT NULL
  );
  CREATE TABLE indexer_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export interface IndexedContract {
  contractId: string;
  payload: unknown;
}

export interface NotificationRow {
  id: number;
  kind: string;
  title: string;
  body: string;
  contractId: string | null;
  createdAt: number;
  readAt: number | null;
}

export interface AnalyticsEventInput {
  sessionId: string;
  party?: string;
  name: string;
  props?: string;
}

// Callers get this narrow surface, never the raw Database handle: every
// query the app can run is enumerated here, so tests exercise exactly the
// statements production uses and no route can grow an ad-hoc SQL path.
export class KydDb {
  constructor(private readonly db: Database.Database) {}

  // -- users ---------------------------------------------------------------

  recordUserLogin(userId: string, party: string, role: string, nowMs = Date.now()): void {
    this.db
      .prepare(
        `INSERT INTO users (user_id, party, role, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET last_login_at = excluded.last_login_at`,
      )
      .run(userId, party, role, nowMs, nowMs);
  }

  // -- indexed contracts (the indexer's ACS read model) ----------------------

  // Returns true only the first time this contract id is seen — the signal
  // the indexer's notification derivation keys off. A conflict re-activates
  // the row (archived_at = NULL) so one flaky poll that missed a contract
  // can't permanently tombstone it, but is never "new" again.
  upsertContract(contractId: string, template: string, payload: unknown, nowMs = Date.now()): boolean {
    const exists =
      this.db.prepare(`SELECT 1 FROM indexed_contracts WHERE contract_id = ?`).get(contractId) !== undefined;
    if (exists) {
      this.db
        .prepare(`UPDATE indexed_contracts SET payload = ?, archived_at = NULL WHERE contract_id = ?`)
        .run(JSON.stringify(payload), contractId);
      return false;
    }
    this.db
      .prepare(
        `INSERT INTO indexed_contracts (contract_id, template, payload, first_seen_at, archived_at)
         VALUES (?, ?, ?, ?, NULL)`,
      )
      .run(contractId, template, JSON.stringify(payload), nowMs);
    return true;
  }

  // Archives every active row of `template` that is NOT in the current ACS
  // snapshot, returning what was archived so the indexer can derive
  // "this offer went away" transitions from the final payload.
  markArchivedExcept(template: string, activeContractIds: string[], nowMs = Date.now()): IndexedContract[] {
    const rows = this.db
      .prepare(
        `UPDATE indexed_contracts SET archived_at = ?
         WHERE template = ? AND archived_at IS NULL
           AND contract_id NOT IN (SELECT value FROM json_each(?))
         RETURNING contract_id, payload`,
      )
      .all(nowMs, template, JSON.stringify(activeContractIds)) as { contract_id: string; payload: string }[];
    return rows.map((r) => ({ contractId: r.contract_id, payload: JSON.parse(r.payload) as unknown }));
  }

  getActiveContracts(template: string): IndexedContract[] {
    const rows = this.db
      .prepare(`SELECT contract_id, payload FROM indexed_contracts WHERE template = ? AND archived_at IS NULL`)
      .all(template) as { contract_id: string; payload: string }[];
    return rows.map((r) => ({ contractId: r.contract_id, payload: JSON.parse(r.payload) as unknown }));
  }

  countActiveByTemplate(): Record<string, number> {
    const rows = this.db
      .prepare(`SELECT template, COUNT(*) AS n FROM indexed_contracts WHERE archived_at IS NULL GROUP BY template`)
      .all() as { template: string; n: number }[];
    return Object.fromEntries(rows.map((r) => [r.template, r.n]));
  }

  // -- notifications ---------------------------------------------------------

  insertNotification(
    n: { party: string; kind: string; title: string; body: string; contractId?: string },
    nowMs = Date.now(),
  ): number {
    const result = this.db
      .prepare(
        `INSERT INTO notifications (party, kind, title, body, contract_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(n.party, n.kind, n.title, n.body, n.contractId ?? null, nowMs);
    return Number(result.lastInsertRowid);
  }

  listNotifications(party: string, limit: number): NotificationRow[] {
    const rows = this.db
      .prepare(
        `SELECT id, kind, title, body, contract_id, created_at, read_at FROM notifications
         WHERE party = ? ORDER BY id DESC LIMIT ?`,
      )
      .all(party, limit) as {
      id: number;
      kind: string;
      title: string;
      body: string;
      contract_id: string | null;
      created_at: number;
      read_at: number | null;
    }[];
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      contractId: r.contract_id,
      createdAt: r.created_at,
      readAt: r.read_at,
    }));
  }

  // Scoped to `party` in the WHERE clause, not just validated upstream: even
  // a bug in the route's validation can't let one party mark another's rows.
  markNotificationsRead(party: string, ids: number[], nowMs = Date.now()): number {
    const result = this.db
      .prepare(
        `UPDATE notifications SET read_at = ?
         WHERE party = ? AND read_at IS NULL AND id IN (SELECT value FROM json_each(?))`,
      )
      .run(nowMs, party, JSON.stringify(ids));
    return result.changes;
  }

  countUnreadNotifications(party: string): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE party = ? AND read_at IS NULL`)
      .get(party) as { n: number };
    return row.n;
  }

  // -- analytics ---------------------------------------------------------------

  insertAnalyticsEvents(events: AnalyticsEventInput[], nowMs = Date.now()): number {
    const insert = this.db.prepare(
      `INSERT INTO analytics_events (session_id, party, name, props, created_at) VALUES (?, ?, ?, ?, ?)`,
    );
    const insertAll = this.db.transaction((batch: AnalyticsEventInput[]) => {
      for (const e of batch) insert.run(e.sessionId, e.party ?? null, e.name, e.props ?? null, nowMs);
    });
    insertAll(events);
    return events.length;
  }

  analyticsCountsByName(): Record<string, number> {
    const rows = this.db
      .prepare(`SELECT name, COUNT(*) AS n FROM analytics_events GROUP BY name`)
      .all() as { name: string; n: number }[];
    return Object.fromEntries(rows.map((r) => [r.name, r.n]));
  }

  // -- indexer state ------------------------------------------------------------

  getIndexerState(key: string): string | null {
    const row = this.db.prepare(`SELECT value FROM indexer_state WHERE key = ?`).get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? null;
  }

  setIndexerState(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO indexer_state (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      )
      .run(key, value);
  }

  // -- webhook replay protection ---------------------------------------------

  seenWebhookDelivery(deliveryId: string): boolean {
    return this.db.prepare(`SELECT 1 FROM webhook_deliveries WHERE delivery_id = ?`).get(deliveryId) !== undefined;
  }

  recordWebhookDelivery(deliveryId: string, nowMs = Date.now()): void {
    this.db
      .prepare(`INSERT OR IGNORE INTO webhook_deliveries (delivery_id, received_at) VALUES (?, ?)`)
      .run(deliveryId, nowMs);
  }

  // -- ops ---------------------------------------------------------------------

  // The healthz "db" check: proves the handle is open and the file readable,
  // nothing more.
  ping(): boolean {
    return (this.db.prepare(`SELECT 1 AS ok`).get() as { ok: number }).ok === 1;
  }

  close(): void {
    this.db.close();
  }
}

export function openDb(path: string): KydDb {
  const inMemory = path === ":memory:";
  if (!inMemory) mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  // WAL lets the indexer's writes and the HTTP routes' reads interleave
  // without "database is locked" — meaningless (and rejected) for :memory:.
  if (!inMemory) db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const applied = db.pragma("user_version", { simple: true }) as number;
  for (let v = applied; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
  return new KydDb(db);
}
