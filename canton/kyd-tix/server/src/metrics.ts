import type { RequestHandler } from "express";

// Hand-rolled Prometheus exposition — the full client library buys
// histograms and push gateways this server doesn't need, at the cost of a
// dependency in the custody boundary. Counters and gauges with a bounded
// label set are enough for the ops questions that actually come up
// ("is traffic flowing", "is the indexer alive").

type Labels = Record<string, string>;

// Deterministic key so {a,b} and {b,a} are the same series.
function labelKey(labels: Labels): string {
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}="${labels[k].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(",");
}

class Metric {
  protected readonly series = new Map<string, number>();
  constructor(
    readonly name: string,
    readonly help: string,
    readonly type: "counter" | "gauge",
  ) {}

  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} ${this.type}`];
    if (this.series.size === 0 && this.type === "counter") lines.push(`${this.name} 0`);
    for (const [key, value] of this.series) {
      lines.push(key === "" ? `${this.name} ${value}` : `${this.name}{${key}} ${value}`);
    }
    return lines.join("\n");
  }
}

export class Counter extends Metric {
  inc(labels: Labels = {}, by = 1): void {
    const key = labelKey(labels);
    this.series.set(key, (this.series.get(key) ?? 0) + by);
  }
}

export class Gauge extends Metric {
  set(value: number, labels: Labels = {}): void {
    this.series.set(labelKey(labels), value);
  }
}

export class MetricsRegistry {
  private readonly metrics = new Map<string, Metric>();

  // Idempotent by name so modules can call counter()/gauge() at use sites
  // without coordinating a single registration point.
  counter(name: string, help: string): Counter {
    let m = this.metrics.get(name);
    if (!m) {
      m = new Counter(name, help, "counter");
      this.metrics.set(name, m);
    }
    return m as Counter;
  }

  gauge(name: string, help: string): Gauge {
    let m = this.metrics.get(name);
    if (!m) {
      m = new Gauge(name, help, "gauge");
      this.metrics.set(name, m);
    }
    return m as Gauge;
  }

  render(): string {
    return [...this.metrics.values()].map((m) => m.render()).join("\n") + "\n";
  }
}

// One process-wide registry, mirroring how prom-client's default registry is
// used: producers (indexer, middleware) and the /metrics route agree on it
// without threading it through every constructor.
export const metrics = new MetricsRegistry();

// The route label must come from the matched route DEFINITION, never the raw
// URL — otherwise every distinct contract id or probe path becomes its own
// Prometheus series (unbounded cardinality). Unmatched requests (404s,
// scanner noise) all collapse into one "other" bucket.
export function httpMetricsMiddleware(): RequestHandler {
  const requests = metrics.counter("http_requests_total", "HTTP requests handled, by method/route/status.");
  return (req, res, next) => {
    res.on("finish", () => {
      const route = req.route ? `${req.baseUrl}${(req.route as { path: string }).path}` : "other";
      requests.inc({ method: req.method, route, status: String(res.statusCode) });
    });
    next();
  };
}
