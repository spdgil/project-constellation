import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockRateLimit = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
}));

const mockLoadSectors = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  loadSectorOpportunities: (...args: unknown[]) => mockLoadSectors(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("GET /api/sectors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns sector opportunities", async () => {
    mockLoadSectors.mockResolvedValueOnce([{ id: "s1", name: "Sector 1" }]);
    const res = await GET(new Request("http://localhost/api/sectors"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});
