import { describe, it, expect } from "vitest";
import {
  buildStrategyGradeSystemPrompt,
  buildStrategyGradeUserPrompt,
  parseStrategyGradeResponse,
} from "./strategy-grade";

/* ------------------------------------------------------------------ */
/*  buildStrategyGradeSystemPrompt                                     */
/* ------------------------------------------------------------------ */
describe("buildStrategyGradeSystemPrompt", () => {
  it("includes grading scale letters", () => {
    const prompt = buildStrategyGradeSystemPrompt();
    for (const grade of ["A", "A-", "B", "B-", "C", "D", "F"]) {
      expect(prompt).toContain(`**${grade}**`);
    }
  });

  it("describes all six blueprint components", () => {
    const prompt = buildStrategyGradeSystemPrompt();
    expect(prompt).toContain("Sector Diagnostics and Comparative Advantage");
    expect(prompt).toContain("Economic Geography and Places of Production");
    expect(prompt).toContain("Regulatory and Enabling Environment");
    expect(prompt).toContain("Value Chain and Market Integration");
    expect(prompt).toContain("Workforce and Skills Alignment");
    expect(prompt).toContain("Sector Culture and Norms");
  });

  it("specifies the expected output JSON fields", () => {
    const prompt = buildStrategyGradeSystemPrompt();
    expect(prompt).toContain("grade_letter");
    expect(prompt).toContain("grade_rationale_short");
    expect(prompt).toContain("evidence_notes_by_component");
    expect(prompt).toContain("missing_elements");
    expect(prompt).toContain("scope_discipline_notes");
  });

  it("mentions scope discipline guidance", () => {
    const prompt = buildStrategyGradeSystemPrompt();
    expect(prompt).toContain("Scope Discipline");
    expect(prompt).toContain("enabling rather than delivering");
  });
});

/* ------------------------------------------------------------------ */
/*  buildStrategyGradeUserPrompt                                       */
/* ------------------------------------------------------------------ */
describe("buildStrategyGradeUserPrompt", () => {
  const strategy = {
    title: "QLD Hydrogen",
    components: {
      "1": "Diagnostics text",
      "2": "Geography text",
      "3": "Regulatory text",
      "4": "Value chain text",
      "5": "Workforce text",
      "6": "Culture text",
    },
    selectionLogic: {
      adjacentDefinition: "Shared supply chains",
      growthDefinition: "High-growth",
      criteria: ["export potential", "jobs"],
    },
    crossCuttingThemes: ["decarbonisation"],
    stakeholderCategories: ["government"],
  };

  it("includes the strategy title", () => {
    const prompt = buildStrategyGradeUserPrompt(strategy);
    expect(prompt).toContain("QLD Hydrogen");
  });

  it("includes all component contents", () => {
    const prompt = buildStrategyGradeUserPrompt(strategy);
    expect(prompt).toContain("Diagnostics text");
    expect(prompt).toContain("Geography text");
    expect(prompt).toContain("Culture text");
  });

  it("includes selection logic fields", () => {
    const prompt = buildStrategyGradeUserPrompt(strategy);
    expect(prompt).toContain("Shared supply chains");
    expect(prompt).toContain("High-growth");
    expect(prompt).toContain("export potential, jobs");
  });

  it("includes cross-cutting themes and stakeholder categories", () => {
    const prompt = buildStrategyGradeUserPrompt(strategy);
    expect(prompt).toContain("decarbonisation");
    expect(prompt).toContain("government");
  });

  it("shows (empty) for missing component content", () => {
    const sparse = {
      title: "Sparse",
      components: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" },
      crossCuttingThemes: [],
      stakeholderCategories: [],
    };
    const prompt = buildStrategyGradeUserPrompt(sparse);
    expect(prompt).toContain("(empty)");
  });
});

/* ------------------------------------------------------------------ */
/*  parseStrategyGradeResponse                                         */
/* ------------------------------------------------------------------ */
describe("parseStrategyGradeResponse", () => {
  it("parses a fully valid response", () => {
    const result = parseStrategyGradeResponse({
      grade_letter: "A-",
      grade_rationale_short: "Strong overall with minor gaps.",
      evidence_notes_by_component: {
        "1": "Well covered.",
        "2": "Good detail.",
        "3": "Adequate.",
        "4": "Comprehensive.",
        "5": "Solid.",
        "6": "Could improve.",
      },
      missing_elements: [
        { component_id: "6", reason: "Limited cultural analysis." },
      ],
      scope_discipline_notes: "Strategy stays within scope.",
    });

    expect(result.grade_letter).toBe("A-");
    expect(result.grade_rationale_short).toBe("Strong overall with minor gaps.");
    expect(result.evidence_notes_by_component["1"]).toBe("Well covered.");
    expect(result.missing_elements).toHaveLength(1);
    expect(result.missing_elements[0].componentId).toBe("6");
    expect(result.missing_elements[0].reason).toBe("Limited cultural analysis.");
    expect(result.scope_discipline_notes).toBe("Strategy stays within scope.");
    expect(result.warnings).toHaveLength(0);
  });

  it("falls back to C for invalid grade letter", () => {
    const result = parseStrategyGradeResponse({ grade_letter: "Z" });
    expect(result.grade_letter).toBe("C");
    expect(result.warnings).toContain("Invalid grade_letter from AI — defaulted to C.");
  });

  it("falls back to C for missing grade letter", () => {
    const result = parseStrategyGradeResponse({});
    expect(result.grade_letter).toBe("C");
  });

  it("defaults evidence notes for missing components", () => {
    const result = parseStrategyGradeResponse({
      grade_letter: "B",
      evidence_notes_by_component: { "1": "Present." },
    });
    expect(result.evidence_notes_by_component["1"]).toBe("Present.");
    expect(result.evidence_notes_by_component["2"]).toBe("");
    expect(result.warnings.some((w) => w.includes("component 2"))).toBe(true);
  });

  it("returns safe defaults for completely invalid schema", () => {
    // safeParse fails when required top-level shape is wrong (e.g. an array)
    const result = parseStrategyGradeResponse(
      // Force a schema-level error — z.object on a non-object value
      "not an object" as unknown as Record<string, unknown>,
    );
    expect(result.grade_letter).toBe("C");
    expect(result.grade_rationale_short).toBe("Invalid AI response format.");
    expect(result.warnings).toContain(
      "Invalid AI response shape — defaulted to safe values.",
    );
  });

  it("accepts all valid grade letters", () => {
    for (const letter of ["A", "A-", "B", "B-", "C", "D", "F"] as const) {
      const result = parseStrategyGradeResponse({ grade_letter: letter });
      expect(result.grade_letter).toBe(letter);
    }
  });

  it("filters out malformed missing_elements (causes schema fallback)", () => {
    // Malformed array items cause zod safeParse to fail → safe defaults
    const result = parseStrategyGradeResponse({
      grade_letter: "B",
      missing_elements: [
        { component_id: "2", reason: "Valid gap." },
        { component_id: 3, reason: "Bad component_id type." }, // number breaks zod
        "not an object",
        null,
      ],
    });
    // safeParse rejects the malformed array, so we get schema-error defaults
    expect(result.grade_letter).toBe("C");
    expect(result.warnings).toContain(
      "Invalid AI response shape — defaulted to safe values.",
    );
  });

  it("maps valid missing_elements to componentId field", () => {
    const result = parseStrategyGradeResponse({
      grade_letter: "B",
      missing_elements: [
        { component_id: "2", reason: "Limited geography analysis." },
        { component_id: "5", reason: "No workforce detail." },
      ],
    });
    expect(result.missing_elements).toHaveLength(2);
    expect(result.missing_elements[0].componentId).toBe("2");
    expect(result.missing_elements[1].reason).toBe("No workforce detail.");
  });

  it("defaults scope_discipline_notes when missing", () => {
    const result = parseStrategyGradeResponse({ grade_letter: "B" });
    expect(result.scope_discipline_notes).toBe("No scope discipline notes provided.");
    expect(result.warnings.some((w) => w.includes("scope_discipline_notes"))).toBe(true);
  });
});
