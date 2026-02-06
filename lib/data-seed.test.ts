/**
 * Sanity checks for Greater Whitsunday seed data (PRD §8.3).
 * Verifies structure and counts so UI can render LGA hypotheses, deals, and cross-LGA comparisons.
 */

import { describe, it, expect } from "vitest";
import { loadLgas, loadDeals, loadOpportunityTypes, loadQldLgaBoundaries } from "./data";

describe("Greater Whitsunday seed data", () => {
  it("loads 3 LGAs (Mackay, Isaac, Whitsunday)", async () => {
    const lgas = await loadLgas();
    expect(lgas).toHaveLength(3);
    const names = lgas.map((l) => l.name).sort();
    expect(names).toEqual(["Isaac", "Mackay", "Whitsunday"]);
  });

  it("each LGA has opportunity hypotheses", async () => {
    const lgas = await loadLgas();
    for (const lga of lgas) {
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

  it("boundaries include all 3 LGAs", async () => {
    const fc = await loadQldLgaBoundaries();
    expect(fc.features).toHaveLength(3);
    const ids = fc.features.map((f) => (f.properties?.id as string) ?? String(f.id)).sort();
    expect(ids).toEqual(["isaac", "mackay", "whitsunday"]);
  });
});
