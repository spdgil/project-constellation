import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deal: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
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
  return new Request("http://localhost/api/deals/deal-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/deals/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 404 when deal does not exist", async () => {
    mockReadJson.mockResolvedValueOnce({
      data: { summary: "Updated" },
    });
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest({}), {
      params: Promise.resolve({ id: "deal-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("updates a deal when valid", async () => {
    mockReadJson.mockResolvedValueOnce({
      data: { summary: "Updated summary" },
    });
    mockFindUnique.mockResolvedValueOnce({ id: "deal-1" });
    mockUpdate.mockResolvedValueOnce({ id: "deal-1" });

    const res = await PATCH(makeRequest({}), {
      params: Promise.resolve({ id: "deal-1" }),
    });
    expect(res.status).toBe(200);
  });
});
