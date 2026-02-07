/**
 * Sanity checks for Greater Whitsunday seed data (PRD §8.3).
 * Verifies structure and counts so UI can render LGA hypotheses, deals, and cross-LGA comparisons.
 */

import { describe, it, expect } from "vitest";
import {
  loadLgas,
  loadDeals,
  loadOpportunityTypes,
  loadQldLgaBoundaries,
  loadSectorOpportunities,
  loadStrategies,
  loadStrategyGrades,
} from "./data";
import {
  SECTOR_OPPORTUNITY_SECTION_NAMES,
  STRATEGY_COMPONENT_NAMES,
  STRATEGY_COMPONENT_EDDT_DOMAINS,
  EDDT_DOMAINS,
} from "./types";
import type {
  SectorOpportunitySectionId,
  StrategyComponentId,
} from "./types";

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

// =============================================================================
// Sector Opportunity seed data — REFERENCE_SECTOR_OPPORTUNITY_TEMPLATE.md
// =============================================================================

describe("Sector Opportunity seed data", () => {
  it("loads 7 sector opportunities (GW3 priority sectors)", async () => {
    const sos = await loadSectorOpportunities();
    expect(sos).toHaveLength(7);
  });

  it("each sector opportunity has all 10 sections populated", async () => {
    const sos = await loadSectorOpportunities();
    const sectionIds: SectorOpportunitySectionId[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    for (const so of sos) {
      for (const sid of sectionIds) {
        expect(so.sections[sid]).toBeDefined();
        expect(so.sections[sid].length).toBeGreaterThan(0);
      }
    }
  });

  it("each sector opportunity has a non-empty name and id", async () => {
    const sos = await loadSectorOpportunities();
    for (const so of sos) {
      expect(so.id.length).toBeGreaterThan(0);
      expect(so.name.length).toBeGreaterThan(0);
    }
  });

  it("each sector opportunity has at least one tag", async () => {
    const sos = await loadSectorOpportunities();
    for (const so of sos) {
      expect(so.tags.length).toBeGreaterThan(0);
    }
  });

  it("SECTOR_OPPORTUNITY_SECTION_NAMES has all 10 entries", () => {
    expect(Object.keys(SECTOR_OPPORTUNITY_SECTION_NAMES)).toHaveLength(10);
  });
});

// =============================================================================
// Strategy seed data — REFERENCE_SECTOR_DEVELOPMENT_STRATEGY_BLUEPRINT.md
// =============================================================================

describe("Strategy seed data", () => {
  it("loads 1 strategy (GW3 METS diversification)", async () => {
    const strategies = await loadStrategies();
    expect(strategies).toHaveLength(1);
    expect(strategies[0].id).toBe("strategy_gw3_mets_diversification");
  });

  it("strategy references 7 priority sector IDs", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].prioritySectorIds).toHaveLength(7);
  });

  it("strategy priority sector IDs match sector opportunity IDs", async () => {
    const strategies = await loadStrategies();
    const sos = await loadSectorOpportunities();
    const soIds = new Set(sos.map((s) => s.id));
    for (const psId of strategies[0].prioritySectorIds) {
      expect(soIds.has(psId)).toBe(true);
    }
  });

  it("strategy has selection logic with criteria", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].selectionLogic).toBeDefined();
    expect(strategies[0].selectionLogic!.criteria.length).toBeGreaterThan(0);
  });

  it("STRATEGY_COMPONENT_NAMES has all 6 entries", () => {
    expect(Object.keys(STRATEGY_COMPONENT_NAMES)).toHaveLength(6);
  });

  it("STRATEGY_COMPONENT_EDDT_DOMAINS maps to valid EDDT domains", () => {
    const validDomains = new Set(EDDT_DOMAINS);
    const componentIds: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];
    for (const cid of componentIds) {
      const domains = STRATEGY_COMPONENT_EDDT_DOMAINS[cid];
      expect(domains.length).toBeGreaterThan(0);
      for (const d of domains) {
        expect(validDomains.has(d)).toBe(true);
      }
    }
  });
});

// =============================================================================
// Strategy grading seed data — REFERENCE_STRATEGY_GRADING_SYSTEM.md
// =============================================================================

describe("Strategy grading seed data", () => {
  it("loads 1 grading for the GW3 strategy", async () => {
    const grades = await loadStrategyGrades();
    expect(grades).toHaveLength(1);
    expect(grades[0].strategyId).toBe("strategy_gw3_mets_diversification");
  });

  it("grading has a valid grade letter", async () => {
    const grades = await loadStrategyGrades();
    const validGrades = ["A", "A-", "B", "B-", "C", "D", "F"];
    expect(validGrades).toContain(grades[0].gradeLetter);
  });

  it("grading has evidence notes for at least one component", async () => {
    const grades = await loadStrategyGrades();
    const evidence = grades[0].evidenceNotesByComponent;
    expect(Object.keys(evidence).length).toBeGreaterThan(0);
  });

  it("grading has a non-empty rationale", async () => {
    const grades = await loadStrategyGrades();
    expect(grades[0].gradeRationaleShort.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// GW3 rendering completeness — ensures the seeded strategy renders correctly
// =============================================================================

describe("GW3 strategy rendering completeness", () => {
  it("strategy title is non-empty and matches expected", async () => {
    const strategies = await loadStrategies();
    const gw3 = strategies[0];
    expect(gw3.title).toBe(
      "Greater Whitsunday METS Sector, Revenue Diversification Strategy",
    );
  });

  it("strategy summary is non-empty", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].summary.length).toBeGreaterThan(20);
  });

  it("strategy type is sector_development_strategy", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].type).toBe("sector_development_strategy");
  });

  it("strategy has source document reference", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].sourceDocument).toBeDefined();
    expect(strategies[0].sourceDocument!.length).toBeGreaterThan(0);
  });

  it("strategy selection logic has adjacent, growth, and criteria", async () => {
    const strategies = await loadStrategies();
    const sl = strategies[0].selectionLogic!;
    expect(sl.adjacentDefinition).toBeDefined();
    expect(sl.adjacentDefinition!.length).toBeGreaterThan(0);
    expect(sl.growthDefinition).toBeDefined();
    expect(sl.growthDefinition!.length).toBeGreaterThan(0);
    expect(sl.criteria).toHaveLength(5);
  });

  it("strategy has 4 cross-cutting themes", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].crossCuttingThemes).toHaveLength(4);
  });

  it("strategy has 7 stakeholder categories", async () => {
    const strategies = await loadStrategies();
    expect(strategies[0].stakeholderCategories).toHaveLength(7);
  });

  it("grading evidence notes cover all 6 components", async () => {
    const grades = await loadStrategyGrades();
    const evidence = grades[0].evidenceNotesByComponent;
    const componentIds: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];
    for (const cid of componentIds) {
      expect(evidence[cid]).toBeDefined();
      expect(evidence[cid]!.length).toBeGreaterThan(0);
    }
  });

  it("grading has scope discipline notes", async () => {
    const grades = await loadStrategyGrades();
    expect(grades[0].scopeDisciplineNotes).toBeDefined();
    expect(grades[0].scopeDisciplineNotes!.length).toBeGreaterThan(0);
  });

  it("all 7 priority sector IDs resolve to valid sector opportunities", async () => {
    const strategies = await loadStrategies();
    const sos = await loadSectorOpportunities();
    const soIds = new Set(sos.map((s) => s.id));
    const psIds = strategies[0].prioritySectorIds;
    expect(psIds).toHaveLength(7);
    for (const psId of psIds) {
      expect(soIds.has(psId)).toBe(true);
    }
  });

  it("strategy has all 6 blueprint components with 2+ paragraphs each", async () => {
    const strategies = await loadStrategies();
    const gw3 = strategies[0];
    const componentIds: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];
    for (const cid of componentIds) {
      const content = gw3.components[cid];
      expect(content.length).toBeGreaterThan(100);
      // Each component should have at least 2 paragraphs (separated by \n\n)
      const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 0);
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every sector opportunity has all 10 sections with content", async () => {
    const sos = await loadSectorOpportunities();
    const sectionIds: SectorOpportunitySectionId[] = [
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    ];
    for (const so of sos) {
      for (const sid of sectionIds) {
        expect(typeof so.sections[sid]).toBe("string");
        expect(so.sections[sid].length).toBeGreaterThan(10);
      }
    }
  });
});
