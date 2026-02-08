import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockRateLimit = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("GET /api/boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns GeoJSON boundary data", async () => {
    const res = await GET(new Request("http://localhost/api/boundaries"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("FeatureCollection");
  });
});
