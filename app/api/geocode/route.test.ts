import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const mockRateLimit = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_MAPBOX_TOKEN: "test-token" },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("POST /api/geocode", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns coordinates for a valid query", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [149.19, -21.15] },
            properties: {
              match_code: { confidence: "high" },
              full_address: "Mackay, QLD",
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const req = new Request("http://localhost/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Mackay" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lat).toBe(-21.15);
    expect(body.lng).toBe(149.19);
  });
});
