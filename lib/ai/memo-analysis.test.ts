import { describe, it, expect } from "vitest";
import {
  truncateMemoText,
  buildMemoAnalysisSystemPrompt,
  buildMemoAnalysisUserPrompt,
  parseMemoAnalysisResponse,
} from "./memo-analysis";

/* ------------------------------------------------------------------ */
/*  truncateMemoText                                                   */
/* ------------------------------------------------------------------ */
describe("truncateMemoText", () => {
  it("returns short text unchanged", () => {
    const text = "Short memo.";
    expect(truncateMemoText(text)).toBe(text);
  });

  it("returns text at exactly 30 000 chars unchanged", () => {
    const text = "a".repeat(30_000);
    expect(truncateMemoText(text)).toBe(text);
  });

  it("truncates text longer than 30 000 chars and appends notice", () => {
    const text = "b".repeat(50_000);
    const result = truncateMemoText(text);
    expect(result.length).toBeLessThan(text.length);
    expect(result).toContain("[Memo truncated at 30,000 characters]");
    expect(result.startsWith("b".repeat(30_000))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  buildMemoAnalysisSystemPrompt                                      */
/* ------------------------------------------------------------------ */
describe("buildMemoAnalysisSystemPrompt", () => {
  it("includes stage, readiness, and constraint sections", () => {
    const prompt = buildMemoAnalysisSystemPrompt();
    expect(prompt).toContain("definition");
    expect(prompt).toContain("pre-feasibility");
    expect(prompt).toContain("feasibility");
    expect(prompt).toContain("structuring");
    expect(prompt).toContain("transaction-close");
    expect(prompt).toContain("no-viable-projects");
    expect(prompt).toContain("revenue-certainty");
    expect(prompt).toContain("coordination-failure");
  });

  it("embeds provided opportunity types", () => {
    const prompt = buildMemoAnalysisSystemPrompt(
      [{ id: "ot-1", name: "Renewables", definition: "Renewable energy projects" }],
    );
    expect(prompt).toContain("ot-1");
    expect(prompt).toContain("Renewables");
    expect(prompt).toContain("Renewable energy projects");
  });

  it("shows placeholder when no opportunity types provided", () => {
    const prompt = buildMemoAnalysisSystemPrompt(undefined, undefined);
    expect(prompt).toContain("(no existing types)");
  });

  it("embeds provided LGAs", () => {
    const prompt = buildMemoAnalysisSystemPrompt(undefined, [
      { id: "mackay", name: "Mackay" },
    ]);
    expect(prompt).toContain('"mackay"');
    expect(prompt).toContain("Mackay");
  });

  it("shows placeholder when no LGAs provided", () => {
    const prompt = buildMemoAnalysisSystemPrompt(undefined, undefined);
    expect(prompt).toContain("(no LGAs)");
  });
});

/* ------------------------------------------------------------------ */
/*  buildMemoAnalysisUserPrompt                                        */
/* ------------------------------------------------------------------ */
describe("buildMemoAnalysisUserPrompt", () => {
  it("wraps memo text with instruction header", () => {
    const prompt = buildMemoAnalysisUserPrompt("My memo content.");
    expect(prompt).toContain("INVESTMENT MEMO:");
    expect(prompt).toContain("My memo content.");
  });

  it("includes expected JSON field names", () => {
    const prompt = buildMemoAnalysisUserPrompt("anything");
    expect(prompt).toContain('"stage"');
    expect(prompt).toContain('"readinessState"');
    expect(prompt).toContain('"dominantConstraint"');
    expect(prompt).toContain('"suggestedOpportunityType"');
  });
});

/* ------------------------------------------------------------------ */
/*  parseMemoAnalysisResponse                                          */
/* ------------------------------------------------------------------ */
describe("parseMemoAnalysisResponse", () => {
  const validJson = JSON.stringify({
    name: "Solar Farm Mackay",
    stage: "feasibility",
    readinessState: "feasibility-underway",
    dominantConstraint: "revenue-certainty",
    summary: "A solar farm near Mackay.",
    description: "Detailed description.",
    nextStep: "Engage off-taker.",
    investmentValue: "$50M",
    economicImpact: "500 jobs",
    suggestedLocationText: "Paget, Mackay, Queensland",
    suggestedLgaIds: ["mackay"],
    keyStakeholders: ["Mackay Council"],
    risks: ["Weather variability"],
    strategicActions: ["Secure PPA"],
    infrastructureNeeds: ["Grid connection"],
    skillsImplications: "Electrical workforce needed.",
    marketDrivers: "Rising energy demand.",
    governmentPrograms: [{ name: "CIS", description: "Capital incentive." }],
    timeline: [{ label: "Phase 1", date: "2026-Q3" }],
    suggestedOpportunityType: {
      existingId: "renewables",
      confidence: "high",
      reasoning: "Solar is renewables.",
    },
  });

  const opts = {
    memoLabel: "Test Memo",
    opportunityTypes: [{ id: "renewables" }],
    lgas: [{ id: "mackay" }],
  };

  it("parses valid JSON and returns ok: true", () => {
    const result = parseMemoAnalysisResponse(validJson, opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.name).toBe("Solar Farm Mackay");
    expect(result.result.stage).toBe("feasibility");
    expect(result.result.readinessState).toBe("feasibility-underway");
    expect(result.result.dominantConstraint).toBe("revenue-certainty");
    expect(result.result.suggestedLgaIds).toEqual(["mackay"]);
    expect(result.result.suggestedLocationText).toBe("Paget, Mackay, Queensland");
    expect(result.result.keyStakeholders).toEqual(["Mackay Council"]);
    expect(result.result.governmentPrograms).toEqual([
      { name: "CIS", description: "Capital incentive." },
    ]);
    expect(result.result.timeline).toEqual([{ label: "Phase 1", date: "2026-Q3" }]);
    expect(result.result.suggestedOpportunityType.confidence).toBe("high");
  });

  it("returns ok: false for completely invalid JSON", () => {
    const result = parseMemoAnalysisResponse("not json at all {{{{", opts);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Failed to parse");
  });

  it("falls back to defaults for missing fields", () => {
    const result = parseMemoAnalysisResponse("{}", opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.name).toBe("Untitled Deal");
    expect(result.result.stage).toBe("definition");
    expect(result.result.readinessState).toBe("conceptual-interest");
    expect(result.result.dominantConstraint).toBe("coordination-failure");
    expect(result.result.summary).toBe("No summary extracted.");
  });

  it("handles invalid stage/readiness/constraint by falling back", () => {
    const result = parseMemoAnalysisResponse(
      JSON.stringify({
        stage: "invalid-stage",
        readinessState: "not-a-state",
        dominantConstraint: "nope",
      }),
      opts,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.stage).toBe("definition");
    expect(result.result.readinessState).toBe("conceptual-interest");
    expect(result.result.dominantConstraint).toBe("coordination-failure");
  });

  it("filters unknown LGA ids and falls back to mackay", () => {
    const result = parseMemoAnalysisResponse(
      JSON.stringify({ suggestedLgaIds: ["unknown-lga"] }),
      opts,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.suggestedLgaIds).toEqual(["mackay"]);
  });

  it("extracts JSON embedded in markdown fences", () => {
    const wrapped = '```json\n{"name":"Embedded","stage":"structuring"}\n```';
    const result = parseMemoAnalysisResponse(wrapped, opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.name).toBe("Embedded");
    expect(result.result.stage).toBe("structuring");
  });

  it("handles suggestedOpportunityType with proposed new type", () => {
    const json = JSON.stringify({
      suggestedOpportunityType: {
        proposedName: "Defence",
        proposedDefinition: "Defence industry projects.",
        closestExistingId: "renewables",
        closestExistingReasoning: "Both are capital-intensive.",
        confidence: "medium",
        reasoning: "Not a pure renewables play.",
      },
    });
    const result = parseMemoAnalysisResponse(json, opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sot = result.result.suggestedOpportunityType;
    expect(sot.proposedName).toBe("Defence");
    expect(sot.closestExistingId).toBe("renewables");
    expect(sot.confidence).toBe("medium");
  });
});
