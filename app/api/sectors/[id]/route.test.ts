import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    sectorOpportunity: {
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

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("GET /api/sectors/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 404 when sector not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest("http://localhost/api/sectors/s1"), {
      params: Promise.resolve({ id: "s1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns sector when found", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "s1", name: "Sector 1" });
    const res = await GET(new NextRequest("http://localhost/api/sectors/s1"), {
      params: Promise.resolve({ id: "s1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("s1");
  });
});

describe("PATCH /api/sectors/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("updates sector when valid", async () => {
    mockReadJson.mockResolvedValueOnce({ data: { name: "Updated" } });
    mockUpdate.mockResolvedValueOnce({ id: "s1", name: "Updated" });
    const res = await PATCH(
      new NextRequest("http://localhost/api/sectors/s1", { method: "PATCH" }),
      { params: Promise.resolve({ id: "s1" }) },
    );
    expect(res.status).toBe(200);
  });
});
