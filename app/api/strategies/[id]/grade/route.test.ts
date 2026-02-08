import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

/* Mock api-guards — auth always passes */
vi.mock("@/lib/api-guards", () => ({
  requireAuthOrResponse: vi.fn().mockResolvedValue(null),
  rateLimitOrResponse: vi.fn().mockResolvedValue(null),
}));

/* Mock OpenAI */
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

/* Mock shared OpenAI client to use our mockCreate */
vi.mock("@/lib/ai/openai-client", () => ({
  getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }),
}));

/* Mock Prisma */
const mockUpsert = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    strategyGrade: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

/* Mock queries — loadStrategyById */
const mockLoadStrategy = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  loadStrategyById: (...args: unknown[]) => mockLoadStrategy(...args),
}));

/* Mock enum-maps */
vi.mock("@/lib/db/enum-maps", () => ({
  gradeLetterToDb: (g: string) => g === "A-" ? "A_minus" : g === "B-" ? "B_minus" : g,
}));

function makeRouteContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/strategies/:id/grade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 404 when strategy does not exist", async () => {
    mockLoadStrategy.mockResolvedValueOnce(null);

    const res = await POST(
      new Request("http://localhost/api/strategies/missing/grade", { method: "POST" }),
      makeRouteContext("missing"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when strategy has no components", async () => {
    mockLoadStrategy.mockResolvedValueOnce({
      id: "test-id",
      title: "Empty",
      summary: "",
      components: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" },
      crossCuttingThemes: [],
      stakeholderCategories: [],
    });

    const res = await POST(
      new Request("http://localhost/api/strategies/test-id/grade", { method: "POST" }),
      makeRouteContext("test-id"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("no blueprint components");
  });

  it("returns grading result with valid AI response", async () => {
    mockLoadStrategy.mockResolvedValueOnce({
      id: "test-id",
      title: "Test Strategy",
      summary: "A test strategy.",
      components: {
        "1": "Sector diagnostics content.",
        "2": "Economic geography.",
        "3": "Regulatory framework.",
        "4": "Value chain.",
        "5": "Workforce.",
        "6": "Culture.",
      },
      selectionLogic: { criteria: ["govt_priority"] },
      crossCuttingThemes: ["skills"],
      stakeholderCategories: ["government"],
    });

    const aiResponse = {
      grade_letter: "B",
      grade_rationale_short: "Solid strategy covering most components.",
      evidence_notes_by_component: {
        "1": "Good diagnostics.",
        "2": "Adequate geography.",
        "3": "Policy gaps.",
        "4": "Clear value chain.",
        "5": "Skills addressed.",
        "6": "Culture implicit.",
      },
      missing_elements: [
        { component_id: "3", reason: "No regulatory reform roadmap." },
      ],
      scope_discipline_notes: "Appropriate scope, no overclaims.",
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    mockUpsert.mockResolvedValueOnce({ id: "grade-1" });

    const res = await POST(
      new Request("http://localhost/api/strategies/test-id/grade", { method: "POST" }),
      makeRouteContext("test-id"),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.gradeLetter).toBe("B");
    expect(body.gradeRationaleShort).toContain("Solid strategy");
    expect(body.evidenceNotesByComponent["1"]).toBe("Good diagnostics.");
    expect(body.missingElements).toHaveLength(1);
    expect(body.missingElements[0].componentId).toBe("3");
    expect(body.scopeDisciplineNotes).toContain("Appropriate scope");
    expect(body.warnings).toEqual([]);
  });

  it("returns warnings and defaults for malformed AI response", async () => {
    mockLoadStrategy.mockResolvedValueOnce({
      id: "test-id",
      title: "Test",
      summary: "Test.",
      components: { "1": "Content.", "2": "", "3": "", "4": "", "5": "", "6": "" },
      crossCuttingThemes: [],
      stakeholderCategories: [],
    });

    // AI returns invalid grade and missing fields
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            grade_letter: "Z",
            // Missing grade_rationale_short, evidence, scope_discipline_notes
          }),
        },
      }],
    });

    mockUpsert.mockResolvedValueOnce({ id: "grade-2" });

    const res = await POST(
      new Request("http://localhost/api/strategies/test-id/grade", { method: "POST" }),
      makeRouteContext("test-id"),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    // Defaults
    expect(body.gradeLetter).toBe("C");
    expect(body.gradeRationaleShort).toBe("No rationale provided.");
    // Warnings
    expect(body.warnings.length).toBeGreaterThan(0);
    expect(body.warnings.some((w: string) => w.includes("Invalid grade_letter"))).toBe(true);
    expect(body.warnings.some((w: string) => w.includes("grade_rationale_short"))).toBe(true);
    expect(body.warnings.some((w: string) => w.includes("evidence"))).toBe(true);
  });

  it("returns 502 when AI response is not valid JSON", async () => {
    mockLoadStrategy.mockResolvedValueOnce({
      id: "test-id",
      title: "Test",
      summary: "Test.",
      components: { "1": "Content.", "2": "", "3": "", "4": "", "5": "", "6": "" },
      crossCuttingThemes: [],
      stakeholderCategories: [],
    });

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "This is not JSON." } }],
    });

    const res = await POST(
      new Request("http://localhost/api/strategies/test-id/grade", { method: "POST" }),
      makeRouteContext("test-id"),
    );
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/failed to parse/i);
  });
});
