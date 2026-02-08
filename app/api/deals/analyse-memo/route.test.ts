import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

/* Mock api-guards — auth always passes */
vi.mock("@/lib/api-guards", () => ({
  requireAuthOrResponse: vi.fn().mockResolvedValue(null),
  rateLimitOrResponse: vi.fn().mockResolvedValue(null),
}));

/* Mock OpenAI — intercept the constructor and chat.completions.create */
const mockCreate = vi.fn();
vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  }
  // Attach APIError for error handling tests
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

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/deals/analyse-memo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/deals/analyse-memo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 400 if memoText is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("memoText is required");
  });

  it("returns structured result with name and OT suggestion on successful analysis", async () => {
    const aiResponse = {
      name: "GW3 Critical Minerals Processing Hub",
      stage: "feasibility",
      readinessState: "feasibility-underway",
      dominantConstraint: "early-risk-capital",
      summary: "A promising mining project.",
      description: "Multi-paragraph description.",
      nextStep: "Complete ESIA.",
      investmentValue: "$30M",
      economicImpact: "150 jobs",
      keyStakeholders: ["Corp A"],
      risks: ["Permitting risk"],
      strategicActions: ["Submit planning application"],
      governmentPrograms: [
        { name: "NAIF", description: "Northern fund" },
      ],
      timeline: [{ label: "Phase 1", date: "Q2 2026" }],
      suggestedOpportunityType: {
        existingId: "critical-minerals",
        confidence: "high",
        reasoning: "The project is focused on critical minerals.",
      },
    };

    mockCreate.mockResolvedValueOnce({
      choices: [
        { message: { content: JSON.stringify(aiResponse) } },
      ],
    });

    const res = await POST(
      makeRequest({
        memoText: "An investment memo about a mining project.",
        memoLabel: "Mining Memo",
        opportunityTypes: [
          { id: "critical-minerals", name: "Critical minerals", definition: "Processing." },
        ],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.name).toBe("GW3 Critical Minerals Processing Hub");
    expect(body.stage).toBe("feasibility");
    expect(body.readinessState).toBe("feasibility-underway");
    expect(body.dominantConstraint).toBe("early-risk-capital");
    expect(body.summary).toBe("A promising mining project.");
    expect(body.investmentValue).toBe("$30M");
    expect(body.keyStakeholders).toEqual(["Corp A"]);
    expect(body.risks).toEqual(["Permitting risk"]);
    expect(body.governmentPrograms).toHaveLength(1);
    expect(body.timeline).toHaveLength(1);
    expect(body.memoReference.label).toBe("Investment Memo: Mining Memo");

    // OT suggestion validated
    expect(body.suggestedOpportunityType.existingId).toBe("critical-minerals");
    expect(body.suggestedOpportunityType.confidence).toBe("high");
    expect(body.suggestedOpportunityType.reasoning).toBe("The project is focused on critical minerals.");

    // Verify OpenAI was called with gpt-4o
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o",
        temperature: 0.3,
      })
    );
  });

  it("suggests a new opportunity type when AI proposes one", async () => {
    const aiResponse = {
      name: "Wool Processing Facility",
      stage: "definition",
      readinessState: "conceptual-interest",
      dominantConstraint: "coordination-failure",
      summary: "Wool processing.",
      suggestedOpportunityType: {
        proposedName: "Agricultural processing",
        proposedDefinition: "Value-add processing of agricultural products.",
        confidence: "medium",
        reasoning: "Wool processing does not fit existing categories.",
      },
    };

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiResponse) } }],
    });

    const res = await POST(
      makeRequest({
        memoText: "Wool processing memo.",
        opportunityTypes: [
          { id: "critical-minerals", name: "Critical minerals", definition: "Mining." },
        ],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.suggestedOpportunityType.proposedName).toBe("Agricultural processing");
    expect(body.suggestedOpportunityType.proposedDefinition).toBe(
      "Value-add processing of agricultural products."
    );
    expect(body.suggestedOpportunityType.confidence).toBe("medium");
    expect(body.suggestedOpportunityType.existingId).toBeUndefined();
  });

  it("falls back to defaults for invalid enum values and missing name", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              stage: "invalid-stage",
              readinessState: "not-real",
              dominantConstraint: "bad-value",
              summary: "Test summary",
            }),
          },
        },
      ],
    });

    const res = await POST(
      makeRequest({ memoText: "Some memo text." })
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    // Should fall back to defaults
    expect(body.name).toBe("Untitled Deal");
    expect(body.stage).toBe("definition");
    expect(body.readinessState).toBe("conceptual-interest");
    expect(body.dominantConstraint).toBe("coordination-failure");
    expect(body.summary).toBe("Test summary");
  });

  it("returns 502 if AI response is not valid JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        { message: { content: "This is not JSON at all" } },
      ],
    });

    const res = await POST(
      makeRequest({ memoText: "Some memo." })
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/failed to parse/i);
  });

  it("extracts JSON from markdown fenced response", async () => {
    const aiResponse = {
      name: "Solar Infrastructure Fund",
      stage: "structuring",
      readinessState: "structurable-but-stalled",
      dominantConstraint: "revenue-certainty",
      summary: "Extracted from fenced block.",
    };

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: `\`\`\`json\n${JSON.stringify(aiResponse)}\n\`\`\``,
          },
        },
      ],
    });

    const res = await POST(
      makeRequest({ memoText: "Memo text." })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Solar Infrastructure Fund");
    expect(body.stage).toBe("structuring");
    expect(body.summary).toBe("Extracted from fenced block.");
  });

  it("uses default memoLabel when none provided", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Test Project",
              stage: "definition",
              readinessState: "conceptual-interest",
              dominantConstraint: "coordination-failure",
              summary: "Test.",
            }),
          },
        },
      ],
    });

    const res = await POST(
      makeRequest({ memoText: "Memo text." })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.memoReference.label).toBe(
      "Investment Memo: Investment Memo"
    );
  });

  it("truncates extremely long memos", async () => {
    const longMemo = "x".repeat(35_000);

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Long Memo Deal",
              stage: "definition",
              readinessState: "conceptual-interest",
              dominantConstraint: "coordination-failure",
              summary: "Truncated.",
            }),
          },
        },
      ],
    });

    await POST(makeRequest({ memoText: longMemo }));

    // The user prompt should contain truncated text
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user"
    );
    expect(userMessage.content).toContain("[Memo truncated at 30,000 characters]");
  });

  it("prompt asks AI for a deal name", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Hydrogen Export Facility",
              stage: "definition",
              summary: "Test.",
            }),
          },
        },
      ],
    });

    await POST(makeRequest({ memoText: "Memo." }));

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user"
    );
    expect(userMessage.content).toContain('"name"');
    expect(userMessage.content).toContain("deal/project name");
  });
});
