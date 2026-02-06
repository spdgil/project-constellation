/**
 * Tests for lib/opportunities.ts — core aggregation engine.
 * Covers countByReadiness, countByConstraint, topConstraints,
 * constraintsAcrossLgas, stallPoints, dealLgaNames, constraintSummaryByLga.
 */

import { describe, it, expect } from "vitest";
import type { Deal, LGA } from "./types";
import {
  countByReadiness,
  countByConstraint,
  topConstraints,
  constraintsAcrossLgas,
  stallPoints,
  dealLgaNames,
  constraintSummaryByLga,
} from "./opportunities";

/* ------------------------------------------------------------------ */
/* Test fixtures                                                       */
/* ------------------------------------------------------------------ */

const baseDeal: Deal = {
  id: "d1",
  name: "Deal 1",
  opportunityTypeId: "ot1",
  lgaIds: ["mackay"],
  stage: "definition",
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
  makeDeal({ id: "d1", readinessState: "conceptual-interest", dominantConstraint: "revenue-certainty", lgaIds: ["mackay"] }),
  makeDeal({ id: "d2", readinessState: "conceptual-interest", dominantConstraint: "revenue-certainty", lgaIds: ["isaac"] }),
  makeDeal({ id: "d3", readinessState: "feasibility-underway", dominantConstraint: "planning-and-approvals", lgaIds: ["mackay", "isaac"] }),
  makeDeal({ id: "d4", readinessState: "structurable-but-stalled", dominantConstraint: "technology-risk", lgaIds: ["whitsunday"] }),
  makeDeal({ id: "d5", readinessState: "feasibility-underway", dominantConstraint: "revenue-certainty", lgaIds: ["whitsunday"] }),
];

const lgas: LGA[] = [
  { id: "mackay", name: "Mackay", geometryRef: "mackay" },
  { id: "isaac", name: "Isaac", geometryRef: "isaac" },
  { id: "whitsunday", name: "Whitsunday", geometryRef: "whitsunday" },
];

/* ------------------------------------------------------------------ */
/* countByReadiness                                                    */
/* ------------------------------------------------------------------ */

describe("countByReadiness", () => {
  it("counts deals grouped by readiness state in ladder order", () => {
    const result = countByReadiness(deals);
    expect(result).toHaveLength(3);
    // Ladder order: conceptual-interest, feasibility-underway, structurable-but-stalled
    expect(result[0].readinessState).toBe("conceptual-interest");
    expect(result[0].count).toBe(2);
    expect(result[1].readinessState).toBe("feasibility-underway");
    expect(result[1].count).toBe(2);
    expect(result[2].readinessState).toBe("structurable-but-stalled");
    expect(result[2].count).toBe(1);
  });

  it("includes human-readable labels", () => {
    const result = countByReadiness(deals);
    expect(result[0].label).toBe("Conceptual interest");
  });

  it("returns empty array for empty input", () => {
    expect(countByReadiness([])).toEqual([]);
  });

  it("omits states with zero count", () => {
    const result = countByReadiness(deals);
    const states = result.map((r) => r.readinessState);
    expect(states).not.toContain("no-viable-projects");
    expect(states).not.toContain("scaled-and-replicable");
  });
});

/* ------------------------------------------------------------------ */
/* countByConstraint                                                   */
/* ------------------------------------------------------------------ */

describe("countByConstraint", () => {
  it("counts deals by dominant constraint sorted by count descending", () => {
    const result = countByConstraint(deals);
    expect(result[0].constraint).toBe("revenue-certainty");
    expect(result[0].count).toBe(3);
    expect(result[1].count).toBeLessThanOrEqual(result[0].count);
  });

  it("includes human-readable labels", () => {
    const result = countByConstraint(deals);
    expect(result[0].label).toBe("Revenue certainty");
  });

  it("returns empty array for empty input", () => {
    expect(countByConstraint([])).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* topConstraints                                                      */
/* ------------------------------------------------------------------ */

describe("topConstraints", () => {
  it("returns top N constraints by count", () => {
    const result = topConstraints(deals, 2);
    expect(result).toHaveLength(2);
    expect(result[0].constraint).toBe("revenue-certainty");
  });

  it("returns all if fewer than N", () => {
    const single = [makeDeal({ id: "s1" })];
    expect(topConstraints(single, 5)).toHaveLength(1);
  });

  it("defaults to top 2", () => {
    const result = topConstraints(deals);
    expect(result.length).toBeLessThanOrEqual(2);
  });
});

/* ------------------------------------------------------------------ */
/* constraintsAcrossLgas                                               */
/* ------------------------------------------------------------------ */

describe("constraintsAcrossLgas", () => {
  it("returns constraints that appear in 2+ LGAs", () => {
    const result = constraintsAcrossLgas(deals);
    // revenue-certainty appears in mackay, isaac, whitsunday (3 LGAs)
    const revCert = result.find((r) => r.constraint === "revenue-certainty");
    expect(revCert).toBeDefined();
    expect(revCert!.lgaCount).toBe(3);
  });

  it("excludes constraints appearing in only 1 LGA", () => {
    const result = constraintsAcrossLgas(deals);
    const techRisk = result.find((r) => r.constraint === "technology-risk");
    expect(techRisk).toBeUndefined();
  });

  it("includes human-readable labels", () => {
    const result = constraintsAcrossLgas(deals);
    expect(result[0].label).toBeTruthy();
  });

  it("sorts by lgaCount descending", () => {
    const result = constraintsAcrossLgas(deals);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].lgaCount).toBeLessThanOrEqual(result[i - 1].lgaCount);
    }
  });

  it("returns empty array for empty input", () => {
    expect(constraintsAcrossLgas([])).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* stallPoints                                                         */
/* ------------------------------------------------------------------ */

describe("stallPoints", () => {
  it("returns readiness states where 2+ deals are clustered", () => {
    const result = stallPoints(deals);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.count).toBeGreaterThanOrEqual(2);
    }
  });

  it("conceptual-interest and feasibility-underway each have 2 deals", () => {
    const result = stallPoints(deals);
    const states = result.map((r) => r.readinessState);
    expect(states).toContain("conceptual-interest");
    expect(states).toContain("feasibility-underway");
  });

  it("returns empty array when all deals have unique states", () => {
    const unique = [
      makeDeal({ id: "u1", readinessState: "conceptual-interest" }),
      makeDeal({ id: "u2", readinessState: "feasibility-underway" }),
      makeDeal({ id: "u3", readinessState: "structurable-but-stalled" }),
    ];
    expect(stallPoints(unique)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* dealLgaNames                                                        */
/* ------------------------------------------------------------------ */

describe("dealLgaNames", () => {
  it("resolves LGA IDs to names", () => {
    const deal = makeDeal({ id: "x1", lgaIds: ["mackay", "isaac"] });
    expect(dealLgaNames(deal, lgas)).toEqual(["Mackay", "Isaac"]);
  });

  it("falls back to raw ID when LGA not found", () => {
    const deal = makeDeal({ id: "x2", lgaIds: ["unknown-lga"] });
    expect(dealLgaNames(deal, lgas)).toEqual(["unknown-lga"]);
  });

  it("returns empty array for deal with no LGAs", () => {
    const deal = makeDeal({ id: "x3", lgaIds: [] });
    expect(dealLgaNames(deal, lgas)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* constraintSummaryByLga                                              */
/* ------------------------------------------------------------------ */

describe("constraintSummaryByLga", () => {
  it("returns one entry per LGA", () => {
    const result = constraintSummaryByLga(deals, lgas);
    expect(result).toHaveLength(lgas.length);
    expect(result.map((r) => r.lgaId)).toEqual(["mackay", "isaac", "whitsunday"]);
  });

  it("includes constraint counts for each LGA", () => {
    const result = constraintSummaryByLga(deals, lgas);
    const mackay = result.find((r) => r.lgaId === "mackay")!;
    // mackay has d1 (revenue-certainty), d3 (planning-and-approvals)
    expect(mackay.constraints.length).toBeGreaterThan(0);
    const constraints = mackay.constraints.map((c) => c.constraint);
    expect(constraints).toContain("revenue-certainty");
    expect(constraints).toContain("planning-and-approvals");
  });

  it("limits to topN constraints per LGA", () => {
    const result = constraintSummaryByLga(deals, lgas, 1);
    for (const entry of result) {
      expect(entry.constraints.length).toBeLessThanOrEqual(1);
    }
  });

  it("returns empty constraints for LGA with no deals", () => {
    const extraLgas = [...lgas, { id: "empty", name: "Empty", geometryRef: "empty" }];
    const result = constraintSummaryByLga(deals, extraLgas);
    const empty = result.find((r) => r.lgaId === "empty")!;
    expect(empty.constraints).toEqual([]);
  });
});
