/**
 * Sanity checks for Greater Whitsunday seed data (PRD §8.3).
 * Verifies structure and counts so UI can render LGA hypotheses, deals, and cross-LGA comparisons.
 */

import { describe, it, expect } from "vitest";
import { loadLgas, loadDeals, loadOpportunityTypes, loadQldLgaBoundaries } from "./data";

describe("Greater Whitsunday seed data", () => {
  it("loads 77 QLD LGAs including Mackay, Isaac, Whitsunday", async () => {
    const lgas = await loadLgas();
    expect(lgas).toHaveLength(77);
    const names = lgas.map((l) => l.name);
    expect(names).toContain("Mackay");
    expect(names).toContain("Isaac");
    expect(names).toContain("Whitsunday");
  });

  it("Greater Whitsunday LGAs have opportunity hypotheses", async () => {
    const lgas = await loadLgas();
    const gwLgas = lgas.filter((l) => ["mackay", "isaac", "whitsunday"].includes(l.id));
    expect(gwLgas).toHaveLength(3);
    for (const lga of gwLgas) {
      expect(lga.opportunityHypotheses).toBeDefined();
      expect(Array.isArray(lga.opportunityHypotheses)).toBe(true);
      expect(lga.opportunityHypotheses!.length).toBeGreaterThan(0);
    }
  });

  it("loads 7 opportunity types (priority sectors)", async () => {
    const types = await loadOpportunityTypes();
    expect(types).toHaveLength(7);
    const ids = types.map((t) => t.id).sort();
    expect(ids).toEqual([
      "bioenergy",
      "biomanufacturing",
      "circular-economy",
      "critical-minerals",
      "post-mining-land-use",
      "renewable-energy",
      "space",
    ]);
  });

  it("loads 11 deal exemplars with evidence pageRef", async () => {
    const deals = await loadDeals();
    expect(deals).toHaveLength(11);
    for (const deal of deals) {
      expect(deal.evidence).toBeDefined();
      expect(deal.evidence.length).toBeGreaterThan(0);
      expect(deal.evidence.some((e) => e.pageRef)).toBe(true);
    }
  });

  it("deals span multiple LGAs for cross-LGA comparison", async () => {
    const deals = await loadDeals();
    const multiLga = deals.filter((d) => d.lgaIds.length > 1);
    expect(multiLga.length).toBeGreaterThan(0);
    const pioneerBurdekin = deals.find((d) => d.id === "pioneer-burdekin-hydro");
    expect(pioneerBurdekin?.lgaIds).toContain("mackay");
    expect(pioneerBurdekin?.lgaIds).toContain("isaac");
  });

  it("LGA activeDealIds reference existing deals", async () => {
    const lgas = await loadLgas();
    const deals = await loadDeals();
    const dealIds = new Set(deals.map((d) => d.id));
    for (const lga of lgas) {
      const activeIds = lga.activeDealIds ?? [];
      for (const id of activeIds) {
        expect(dealIds.has(id)).toBe(true);
      }
    }
  });

  it("boundaries include all QLD LGAs with focus LGAs highlighted", async () => {
    const fc = await loadQldLgaBoundaries();
    expect(fc.features.length).toBeGreaterThanOrEqual(70);

    const focus = fc.features.filter((f) => f.properties?.highlighted);
    const focusIds = focus.map((f) => (f.properties?.id as string)).sort();
    expect(focusIds).toEqual(["isaac", "mackay", "whitsunday"]);
  });
});
