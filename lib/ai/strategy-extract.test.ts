import { describe, it, expect } from "vitest";
import {
  truncateStrategyText,
  buildStrategyExtractSystemPrompt,
  buildStrategyExtractUserPrompt,
  parseStrategyExtractResponse,
} from "./strategy-extract";

/* ------------------------------------------------------------------ */
/*  truncateStrategyText                                               */
/* ------------------------------------------------------------------ */
describe("truncateStrategyText", () => {
  it("returns short text unchanged", () => {
    const text = "Short strategy.";
    expect(truncateStrategyText(text)).toBe(text);
  });

  it("returns text at exactly 60 000 chars unchanged", () => {
    const text = "x".repeat(60_000);
    expect(truncateStrategyText(text)).toBe(text);
  });

  it("truncates text longer than 60 000 chars and appends notice", () => {
    const text = "y".repeat(100_000);
    const result = truncateStrategyText(text);
    expect(result.length).toBeLessThan(text.length);
    expect(result).toContain("[Document truncated at 60,000 characters]");
    expect(result.startsWith("y".repeat(60_000))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  buildStrategyExtractSystemPrompt                                   */
/* ------------------------------------------------------------------ */
describe("buildStrategyExtractSystemPrompt", () => {
  it("mentions all six blueprint components", () => {
    const prompt = buildStrategyExtractSystemPrompt();
    expect(prompt).toContain("Sector Diagnostics & Comparative Advantage");
    expect(prompt).toContain("Economic Geography & Places of Production");
    expect(prompt).toContain("Regulatory & Enabling Environment");
    expect(prompt).toContain("Value Chain & Market Integration");
    expect(prompt).toContain("Workforce & Skills Alignment");
    expect(prompt).toContain("Sector Culture & Norms");
  });

  it("describes expected JSON output structure", () => {
    const prompt = buildStrategyExtractSystemPrompt();
    expect(prompt).toContain('"title"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"components"');
    expect(prompt).toContain('"selectionLogic"');
    expect(prompt).toContain('"crossCuttingThemes"');
    expect(prompt).toContain('"stakeholderCategories"');
    expect(prompt).toContain('"prioritySectorNames"');
  });
});

/* ------------------------------------------------------------------ */
/*  buildStrategyExtractUserPrompt                                     */
/* ------------------------------------------------------------------ */
describe("buildStrategyExtractUserPrompt", () => {
  it("wraps document text with triple-quoted block", () => {
    const prompt = buildStrategyExtractUserPrompt("My strategy doc.");
    expect(prompt).toContain('"""');
    expect(prompt).toContain("My strategy doc.");
  });

  it("includes instruction to analyse the strategy document", () => {
    const prompt = buildStrategyExtractUserPrompt("text");
    expect(prompt).toMatch(/analyse/i);
    expect(prompt).toMatch(/sector development strategy/i);
  });
});

/* ------------------------------------------------------------------ */
/*  parseStrategyExtractResponse                                       */
/* ------------------------------------------------------------------ */
describe("parseStrategyExtractResponse", () => {
  const validJson = JSON.stringify({
    title: "QLD Hydrogen Strategy",
    summary: "A comprehensive hydrogen strategy.",
    components: {
      "1": { content: "Diagnostics content.", confidence: 0.9, sourceExcerpt: "quote 1" },
      "2": { content: "Geography content.", confidence: 0.8, sourceExcerpt: "quote 2" },
      "3": { content: "Regulatory content.", confidence: 0.7, sourceExcerpt: "quote 3" },
      "4": { content: "Value chain content.", confidence: 0.85, sourceExcerpt: "quote 4" },
      "5": { content: "Workforce content.", confidence: 0.6, sourceExcerpt: "quote 5" },
      "6": { content: "Culture content.", confidence: 0.4, sourceExcerpt: "quote 6" },
    },
    selectionLogic: {
      adjacentDefinition: "Adjacent sectors share supply chains.",
      growthDefinition: "High-growth sectors.",
      criteria: ["employment potential", "export readiness"],
    },
    crossCuttingThemes: ["decarbonisation", "First Nations"],
    stakeholderCategories: ["government", "industry"],
    prioritySectorNames: ["Hydrogen", "Critical minerals"],
  });

  it("parses valid JSON and returns ok: true", () => {
    const result = parseStrategyExtractResponse(validJson);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.title).toBe("QLD Hydrogen Strategy");
    expect(result.result.summary).toBe("A comprehensive hydrogen strategy.");
    expect(result.result.components["1"].content).toBe("Diagnostics content.");
    expect(result.result.components["1"].confidence).toBe(0.9);
    expect(result.result.selectionLogic.criteria).toEqual(["employment potential", "export readiness"]);
    expect(result.result.crossCuttingThemes).toEqual(["decarbonisation", "First Nations"]);
    expect(result.result.prioritySectorNames).toEqual(["Hydrogen", "Critical minerals"]);
  });

  it("returns ok: false for completely invalid JSON", () => {
    const result = parseStrategyExtractResponse("not json {{{{");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Failed to parse");
  });

  it("falls back to defaults for empty object and generates warnings", () => {
    const result = parseStrategyExtractResponse("{}");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.title).toBe("Untitled Strategy");
    expect(result.result.summary).toBe("No summary extracted.");
    expect(result.result.warnings.length).toBeGreaterThan(0);
    // All components should default to empty
    expect(result.result.components["1"].content).toBe("");
    expect(result.result.components["1"].confidence).toBe(0);
  });

  it("clamps component confidence to 0–1 range", () => {
    const json = JSON.stringify({
      components: {
        "1": { content: "text", confidence: 5.0, sourceExcerpt: "" },
        "2": { content: "text", confidence: -2, sourceExcerpt: "" },
      },
    });
    const result = parseStrategyExtractResponse(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.components["1"].confidence).toBe(1);
    expect(result.result.components["2"].confidence).toBe(0);
  });

  it("handles missing selectionLogic gracefully", () => {
    const json = JSON.stringify({ title: "Test" });
    const result = parseStrategyExtractResponse(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.selectionLogic.adjacentDefinition).toBeNull();
    expect(result.result.selectionLogic.growthDefinition).toBeNull();
    expect(result.result.selectionLogic.criteria).toEqual([]);
  });

  it("extracts JSON embedded in markdown fences", () => {
    const wrapped = '```json\n{"title":"Wrapped Strategy"}\n```';
    const result = parseStrategyExtractResponse(wrapped);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.title).toBe("Wrapped Strategy");
  });
});
