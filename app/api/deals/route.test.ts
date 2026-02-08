import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const mockCreate = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deal: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

const mockRequireAuth = vi.fn();
const mockRateLimit = vi.fn();
const mockReadJson = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  requireAuthOrResponse: (...args: unknown[]) => mockRequireAuth(...args),
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
  readJsonWithLimitOrResponse: (...args: unknown[]) => mockReadJson(...args),
}));

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/deals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 401 when auth guard blocks", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns 400 on validation failure", async () => {
    mockReadJson.mockResolvedValueOnce({ data: { name: "" } });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("creates a deal and returns id", async () => {
    mockReadJson.mockResolvedValueOnce({
      data: {
        name: "Test Deal",
        opportunityTypeId: "ot-1",
        stage: "definition",
        readinessState: "conceptual-interest",
        dominantConstraint: "coordination-failure",
        summary: "Summary",
      },
    });
    mockCreate.mockResolvedValueOnce({ id: "deal-1" });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("deal-1");
  });
});
