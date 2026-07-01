import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import type { Template } from "@daml/types";
import { catalogRouter } from "../src/catalog.js";
import type { QueryableLedger, LedgerContract } from "../src/ledgerSession.js";

function fakeLedger(byTemplateId: Record<string, LedgerContract[]>): QueryableLedger {
  return {
    async query<T extends object, K, I extends string>(template: Template<T, K, I>) {
      return (byTemplateId[template.templateId] ?? []) as LedgerContract<T>[];
    },
  };
}

describe("GET /catalog", () => {
  it("returns events and allocations as plain JSON, with no credential in the response", async () => {
    const ledger = fakeLedger({
      "#kyd-tix:Kyd.Event:Event": [{ contractId: "#ev:0", payload: { eventId: "SHOW-001" } }],
      "#kyd-tix:Kyd.Event:TierAllocation": [
        { contractId: "#al:0", payload: { eventId: "SHOW-001", tierId: "GA" } },
      ],
    });
    const app = express();
    app.use(catalogRouter(ledger));

    const res = await request(app).get("/catalog");
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([{ contractId: "#ev:0", payload: { eventId: "SHOW-001" } }]);
    expect(res.body.allocs).toEqual([
      { contractId: "#al:0", payload: { eventId: "SHOW-001", tierId: "GA" } },
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/token|bearer|actAs/i);
  });

  it("surfaces a 502 if the upstream ledger query fails, rather than a partial catalog", async () => {
    const failing: QueryableLedger = {
      query: async () => {
        throw new Error("ledger unreachable");
      },
    };
    const app = express();
    app.use(catalogRouter(failing));

    const res = await request(app).get("/catalog");
    expect(res.status).toBe(502);
  });
});
