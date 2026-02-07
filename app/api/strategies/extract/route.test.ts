import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

/* Mock OpenAI — intercept the constructor and chat.completions.create */
const mockCreate = vi.fn();
vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  }
  class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = "APIError";
    }
  }
  (MockOpenAI as unknown as Record<string, unknown>).APIError = APIError;
  return { default: MockOpenAI };
});

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/strategies/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/strategies/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 400 if extractedText is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("extractedText is required");
  });

  it("returns structured extraction result on success", async () => {
    const aiResponse = {
      title: "GW3 METS Diversification Strategy",
      summary: "A sector development strategy for METS revenue diversification.",
      components: {
        "1": { content: "Strong diagnostics baseline.", confidence: 0.9, sourceExcerpt: "Based on ABS data." },
        "2": { content: "Mackay region infrastructure.", confidence: 0.8, sourceExcerpt: "Major precincts." },
        "3": { content: "Policy constraints identified.", confidence: 0.6, sourceExcerpt: "Planning barriers." },
        "4": { content: "Value chain positioning.", confidence: 0.85, sourceExcerpt: "Demand drivers." },
        "5": { content: "Skills gaps noted.", confidence: 0.75, sourceExcerpt: "Workforce needs." },
        "6": { content: "Innovation culture emerging.", confidence: 0.5, sourceExcerpt: "Collaboration." },
      },
      selectionLogic: {
        adjacentDefinition: "Adjacent sectors share similar skill bases.",
        growthDefinition: "Growth sectors with policy alignment.",
        criteria: ["government_priority", "sector_maturity"],
      },
      crossCuttingThemes: ["skills_development", "partnerships"],
      stakeholderCategories: ["state_government", "sector_businesses"],
      prioritySectorNames: ["Renewable Energy Services"],
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const res = await POST(makeRequest({ extractedText: "Full document text." }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.title).toBe("GW3 METS Diversification Strategy");
    expect(body.summary).toContain("METS revenue diversification");
    expect(body.components["1"].content).toBe("Strong diagnostics baseline.");
    expect(body.components["1"].confidence).toBe(0.9);
    expect(body.components["1"].sourceExcerpt).toBe("Based on ABS data.");
    expect(body.selectionLogic.adjacentDefinition).toContain("Adjacent");
    expect(body.selectionLogic.criteria).toEqual(["government_priority", "sector_maturity"]);
    expect(body.crossCuttingThemes).toEqual(["skills_development", "partnerships"]);
    expect(body.prioritySectorNames).toEqual(["Renewable Energy Services"]);
    expect(body.warnings).toEqual([]);

    // Verify model and temperature
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o", temperature: 0.3 }),
    );
  });

  it("returns warnings when components are missing from AI response", async () => {
    const aiResponse = {
      title: "Partial Strategy",
      summary: "Missing components.",
      components: {
        "1": { content: "Diagnostics.", confidence: 0.7, sourceExcerpt: "Data." },
        // Components 2–6 deliberately missing
      },
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const res = await POST(makeRequest({ extractedText: "Some text." }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.components["1"].content).toBe("Diagnostics.");
    expect(body.components["2"].content).toBe("");
    expect(body.components["2"].confidence).toBe(0);
    // Should have warnings for missing components 2–6
    expect(body.warnings.length).toBeGreaterThan(0);
    expect(body.warnings.some((w: string) => w.includes("Component 2"))).toBe(true);
  });

  it("defaults title and warns when AI omits it", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "No title here.",
            components: {},
          }),
        },
      }],
    });

    const res = await POST(makeRequest({ extractedText: "Text." }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.title).toBe("Untitled Strategy");
    expect(body.warnings.some((w: string) => w.includes("title"))).toBe(true);
  });

  it("returns 502 if AI response is not valid JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Not JSON at all." } }],
    });

    const res = await POST(makeRequest({ extractedText: "Text." }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/failed to parse/i);
  });

  it("extracts JSON from markdown fenced response", async () => {
    const aiResponse = {
      title: "Fenced Strategy",
      summary: "Extracted from code block.",
      components: {
        "1": { content: "Diagnostics.", confidence: 0.8, sourceExcerpt: "Quote." },
        "2": { content: "Geography.", confidence: 0.7, sourceExcerpt: "Region." },
        "3": { content: "Policy.", confidence: 0.6, sourceExcerpt: "Framework." },
        "4": { content: "Market.", confidence: 0.8, sourceExcerpt: "Demand." },
        "5": { content: "Skills.", confidence: 0.7, sourceExcerpt: "Training." },
        "6": { content: "Culture.", confidence: 0.5, sourceExcerpt: "Innovation." },
      },
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: { content: `\`\`\`json\n${JSON.stringify(aiResponse)}\n\`\`\`` },
      }],
    });

    const res = await POST(makeRequest({ extractedText: "Doc text." }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Fenced Strategy");
  });

  it("truncates very long documents", async () => {
    const longText = "x".repeat(65_000);

    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "Long Doc",
            summary: "Truncated.",
            components: {},
          }),
        },
      }],
    });

    await POST(makeRequest({ extractedText: longText }));

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMessage.content).toContain("[Document truncated at 60,000 characters]");
  });

  it("clamps confidence to [0, 1] range", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            title: "Clamped",
            summary: "Test.",
            components: {
              "1": { content: "Test.", confidence: 1.5, sourceExcerpt: "" },
              "2": { content: "Test.", confidence: -0.3, sourceExcerpt: "" },
              "3": { content: "", confidence: 0.5, sourceExcerpt: "" },
              "4": { content: "", confidence: 0.5, sourceExcerpt: "" },
              "5": { content: "", confidence: 0.5, sourceExcerpt: "" },
              "6": { content: "", confidence: 0.5, sourceExcerpt: "" },
            },
          }),
        },
      }],
    });

    const res = await POST(makeRequest({ extractedText: "Text." }));
    const body = await res.json();
    expect(body.components["1"].confidence).toBe(1);
    expect(body.components["2"].confidence).toBe(0);
  });
});
