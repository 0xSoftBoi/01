/**
 * Contention benchmark — turns the cold-master / hot-shard ARGUMENT into a
 * MEASURED number. It fires the same concurrent issuance load two ways and
 * compares throughput:
 *
 *   - "1 shard":  N concurrent Allocation_Issue against ONE TierAllocation.
 *                 Each issue is a consuming choice, so they contend on one
 *                 contract — Canton serializes them and the client must retry
 *                 on the stale-cid rejections.
 *   - "N shards": N concurrent issues, one per shard. Disjoint contracts, no
 *                 contention — they commit in parallel.
 *
 * Reports items, wall time, throughput (issues/sec), retries, and the speedup.
 *
 * Prereq: `../../integration/run-local.sh` is up (sandbox + demo seed + JSON
 * API on :7575). Run: `npm run bench -- 24`  (24 = concurrent issues).
 */
import { readFileSync } from "fs";
import Ledger from "@daml/ledger";
import { Event, TierAllocation } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";

const HTTP = process.env.KYD_JSON_API ?? "http://localhost:7575";
const PARTIES_FILE =
  process.env.KYD_PARTIES ?? "../../app/public/demo-parties.json";

interface Demo {
  operator: string;
  venue: string;
  artist: string;
}

function b64url(s: string): string {
  return Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// A sandbox JWT acting as all three event signatories (no signature check locally).
function multiToken(parties: string[]): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      "https://daml.com/ledger-api": {
        ledgerId: "sandbox",
        applicationId: "kyd-bench",
        actAs: parties,
        readAs: parties,
      },
    }),
  );
  return `${header}.${payload}.bench`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Issue one ticket from the shard at (eventId, tierId, serialBase), retrying on
// contention by re-reading the shard's current contract id.
async function issueOnce(
  ledger: Ledger,
  parties: Demo,
  eventId: string,
  tierId: string,
  serialBase: number,
  fan: string,
  retries: { n: number },
): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const shards = await ledger.query(TierAllocation, { eventId, tierId });
    const shard = shards.find(
      (s) => Number(s.payload.serialBase) === serialBase && Number(s.payload.sold) < Number(s.payload.size),
    );
    if (!shard) return; // shard exhausted — done
    try {
      await ledger.exercise(TierAllocation.Allocation_Issue, shard.contractId, { fan });
      return;
    } catch {
      retries.n++;
      await sleep(2 * attempt); // tiny backoff; the stale cid will be refreshed on re-query
    }
  }
  throw new Error("issue exceeded retry budget");
}

async function openEvent(
  ledger: Ledger,
  parties: Demo,
  eventId: string,
  shardCount: number,
  perShard: number,
): Promise<number[]> {
  let ev = await ledger.create(Event, {
    operator: parties.operator,
    venue: parties.venue,
    artist: parties.artist,
    eventId,
    name: `bench ${eventId}`,
    eventTime: "2026-12-31T20:00:00Z",
    royaltyBps: "0",
    financingShareBps: "0",
    tiers: [
      {
        tierId: "GA",
        basePrice: "0.0",
        demandBps: "0",
        resaleCapBps: "10000",
        supply: (shardCount * perShard).toString(),
        allocated: "0",
      },
    ],
  });
  const serialBases: number[] = [];
  let evCid = ev.contractId;
  for (let i = 0; i < shardCount; i++) {
    const [result] = await ledger.exercise(Event.Event_OpenAllocation, evCid, {
      tierId: "GA",
      size: perShard.toString(),
    });
    const r = result as { _1: typeof evCid; _2: unknown };
    evCid = r._1;
    const shards = await ledger.query(TierAllocation, { eventId });
    serialBases.push(Math.max(...shards.map((s) => Number(s.payload.serialBase))));
  }
  return serialBases;
}

async function runConfig(
  ledger: Ledger,
  parties: Demo,
  label: string,
  shardCount: number,
  totalIssues: number,
): Promise<{ tps: number; retries: number; ms: number }> {
  const eventId = `BENCH-${label}-${Date.now()}`;
  const perShard = Math.ceil(totalIssues / shardCount);
  const serialBases = await openEvent(ledger, parties, eventId, shardCount, perShard);

  // The @daml/ledger client logs each contention rejection; silence that noise
  // (we count the retries ourselves) so the benchmark output stays readable.
  // Must be set BEFORE the jobs start, since promises begin at creation.
  const realError = console.error;
  console.error = () => {};

  // Build the concurrent workload: round-robin issues across the shards.
  const retries = { n: 0 };
  const t0 = Date.now();
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < totalIssues; i++) {
    const sb = serialBases[i % shardCount];
    jobs.push(issueOnce(ledger, parties, eventId, "GA", sb, parties.venue, retries));
  }
  await Promise.all(jobs);
  const ms = Date.now() - t0;
  console.error = realError;
  const tps = (totalIssues / ms) * 1000;
  console.log(
    `  ${label.padEnd(9)} ${totalIssues} issues / ${shardCount} shard(s): ` +
      `${ms} ms  ${tps.toFixed(1)} issues/s  (${retries.n} contention retries)`,
  );
  return { tps, retries: retries.n, ms };
}

async function main(): Promise<void> {
  const totalIssues = Number(process.argv[2] ?? 24);
  const parties = JSON.parse(readFileSync(PARTIES_FILE, "utf8")) as Demo;
  const ledger = new Ledger({
    token: multiToken([parties.operator, parties.venue, parties.artist]),
    httpBaseUrl: `${HTTP}/`,
  });

  console.log(`Contention benchmark — ${totalIssues} concurrent issues\n`);
  const serial = await runConfig(ledger, parties, "1-shard", 1, totalIssues);
  const parallel = await runConfig(ledger, parties, "N-shards", totalIssues, totalIssues);

  const speedup = parallel.tps / serial.tps;
  console.log(
    `\nSpeedup from sharding: ${speedup.toFixed(2)}x ` +
      `(${serial.retries} retries serialized vs ${parallel.retries} parallel).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
