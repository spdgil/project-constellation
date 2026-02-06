/**
 * Tests for lib/deals-search.ts — deal filtering by query.
 */

import { describe, it, expect } from "vitest";
import type { Deal, OpportunityType, LGA } from "./types";
import { filterDealsByQuery } from "./deals-search";

/* ------------------------------------------------------------------ */
/* Test fixtures                                                       */
/* ------------------------------------------------------------------ */

const baseDeal: Deal = {
  id: "d1",
  name: "Solar Farm Alpha",
  opportunityTypeId: "renewable-energy",
  lgaIds: ["mackay"],
  stage: "concept",
  readinessState: "conceptual-interest",
  dominantConstraint: "revenue-certainty",
  summary: "",
  nextStep: "",
  evidence: [],
  notes: [],
  updatedAt: "2025-01-01T00:00:00Z",
};

function makeDeal(overrides: Partial<Deal> & { id: string }): Deal {
  return { ...baseDeal, ...overrides };
}

const deals: Deal[] = [
  makeDeal({ id: "d1", name: "Solar Farm Alpha", opportunityTypeId: "renewable-energy", lgaIds: ["mackay"] }),
  makeDeal({ id: "d2", name: "Critical Minerals Refinery", opportunityTypeId: "critical-minerals", lgaIds: ["isaac"] }),
  makeDeal({ id: "d3", name: "Biomass Hub", opportunityTypeId: "bioenergy", lgaIds: ["whitsunday"] }),
  makeDeal({ id: "d4", name: "Space Launch Pad", opportunityTypeId: "space", lgaIds: ["mackay", "isaac"] }),
  makeDeal({ id: "d5", name: "Hydrogen Electrolyser", opportunityTypeId: "renewable-energy", lgaIds: ["whitsunday"] }),
];

const opportunityTypes: OpportunityType[] = [
  { id: "renewable-energy", name: "Renewable energy", definition: "", economicFunction: "", typicalCapitalStack: "", typicalRisks: "" },
  { id: "critical-minerals", name: "Critical minerals", definition: "", economicFunction: "", typicalCapitalStack: "", typicalRisks: "" },
  { id: "bioenergy", name: "Bioenergy", definition: "", economicFunction: "", typicalCapitalStack: "", typicalRisks: "" },
  { id: "space", name: "Space", definition: "", economicFunction: "", typicalCapitalStack: "", typicalRisks: "" },
];

const lgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay" },
  { id: "isaac", name: "Isaac", geometryRef: "isaac" },
  { id: "whitsunday", name: "Whitsunday", geometryRef: "whitsunday" },
];

/* ------------------------------------------------------------------ */
/* Basic filtering                                                     */
/* ------------------------------------------------------------------ */

describe("filterDealsByQuery", () => {
  it("returns all deals when query is empty", () => {
    expect(filterDealsByQuery(deals, "", opportunityTypes, lgas)).toHaveLength(5);
  });

  it("returns all deals when query is whitespace", () => {
    expect(filterDealsByQuery(deals, "   ", opportunityTypes, lgas)).toHaveLength(5);
  });

  it("filters by deal name (case-insensitive)", () => {
    const result = filterDealsByQuery(deals, "solar", opportunityTypes, lgas);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("d1");
  });

  it("filters by deal name (partial match)", () => {
    const result = filterDealsByQuery(deals, "farm", opportunityTypes, lgas);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("d1");
  });

  it("filters by opportunity type name", () => {
    const result = filterDealsByQuery(deals, "renewable", opportunityTypes, lgas);
    expect(result).toHaveLength(2);
    const ids = result.map((d) => d.id).sort();
    expect(ids).toEqual(["d1", "d5"]);
  });

  it("filters by LGA name", () => {
    const result = filterDealsByQuery(deals, "Isaac", opportunityTypes, lgas);
    // d2 is in isaac, d4 is in mackay+isaac
    expect(result).toHaveLength(2);
    const ids = result.map((d) => d.id).sort();
    expect(ids).toEqual(["d2", "d4"]);
  });

  it("is case-insensitive for LGA names", () => {
    const result = filterDealsByQuery(deals, "whitsunday", opportunityTypes, lgas);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterDealsByQuery(deals, "zzzznotfound", opportunityTypes, lgas)).toEqual([]);
  });

  it("trims whitespace from query", () => {
    const result = filterDealsByQuery(deals, "  solar  ", opportunityTypes, lgas);
    expect(result).toHaveLength(1);
  });

  it("matches deal name before opportunity type", () => {
    // "space" matches d4's name "Space Launch Pad" and also ot "Space"
    const result = filterDealsByQuery(deals, "space", opportunityTypes, lgas);
    expect(result.some((d) => d.id === "d4")).toBe(true);
  });

  it("handles empty deals array", () => {
    expect(filterDealsByQuery([], "solar", opportunityTypes, lgas)).toEqual([]);
  });

  it("handles empty opportunity types gracefully", () => {
    // With no OTs, matching by OT name won't work, but name/LGA matching should
    const result = filterDealsByQuery(deals, "solar", [], lgas);
    expect(result).toHaveLength(1);
  });

  it("handles empty LGAs gracefully", () => {
    // With no LGAs, LGA name matching won't work, but deal name matching should
    const result = filterDealsByQuery(deals, "solar", opportunityTypes, []);
    expect(result).toHaveLength(1);
  });

  it("matches deals with multiple LGAs", () => {
    // d4 has lgaIds: ["mackay", "isaac"] — searching "mackay" should find it
    const result = filterDealsByQuery(deals, "mackay", opportunityTypes, lgas);
    const ids = result.map((d) => d.id).sort();
    expect(ids).toContain("d1"); // in mackay
    expect(ids).toContain("d4"); // in mackay + isaac
  });
});
