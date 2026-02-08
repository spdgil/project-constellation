import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreateMany = vi.fn();
const mockLoadStrategyById = vi.fn();
type MockTx = {
  sectorDevelopmentStrategy: { update: typeof mockUpdate };
  strategySectorOpportunity: {
    deleteMany: typeof mockDeleteMany;
    createMany: typeof mockCreateMany;
  };
};

const mockTransaction = vi.fn(async (fn: (tx: MockTx) => Promise<void>) => {
  await fn({
    sectorDevelopmentStrategy: { update: mockUpdate },
    strategySectorOpportunity: {
      deleteMany: mockDeleteMany,
      createMany: mockCreateMany,
    },
  });
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    sectorDevelopmentStrategy: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $transaction: (fn: (tx: MockTx) => Promise<void>) => mockTransaction(fn),
  },
}));

vi.mock("@/lib/db/queries", () => ({
  loadStrategyById: (...args: unknown[]) => mockLoadStrategyById(...args),
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
  return new Request("http://localhost/api/strategies/strategy-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/strategies/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 404 when strategy does not exist", async () => {
    mockReadJson.mockResolvedValueOnce({
      data: { summary: "Updated" },
    });
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest({}), {
      params: Promise.resolve({ id: "strategy-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("updates a strategy when valid", async () => {
    mockReadJson.mockResolvedValueOnce({
      data: { summary: "Updated summary" },
    });
    mockFindUnique.mockResolvedValueOnce({ id: "strategy-1" });
    mockLoadStrategyById.mockResolvedValueOnce({ id: "strategy-1" });

    const res = await PATCH(makeRequest({}), {
      params: Promise.resolve({ id: "strategy-1" }),
    });
    expect(res.status).toBe(200);
  });
});
