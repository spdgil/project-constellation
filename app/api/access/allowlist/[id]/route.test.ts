import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    allowedEmail: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

const mockRequireAdmin = vi.fn();
const mockRateLimit = vi.fn();
const mockReadJson = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mockRequireAdmin(...args),
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
  readJsonWithLimitOrResponse: (...args: unknown[]) => mockReadJson(...args),
}));

function makeRequest(method: string, body?: Record<string, unknown>) {
  return new Request("http://localhost/api/access/allowlist/test-id", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const params = Promise.resolve({ id: "test-id" });

describe("PATCH /api/access/allowlist/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 403 when not admin", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    );
    const res = await PATCH(makeRequest("PATCH", { role: "admin" }), { params });
    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown id", async () => {
    mockReadJson.mockResolvedValueOnce({ data: { role: "admin" } });
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await PATCH(makeRequest("PATCH", { role: "admin" }), { params });
    expect(res.status).toBe(404);
  });

  it("updates the role", async () => {
    const existing = { id: "test-id", email: "a@b.com", role: "member", isActive: true };
    const updated = { ...existing, role: "admin" };
    mockReadJson.mockResolvedValueOnce({ data: { role: "admin" } });
    mockFindUnique.mockResolvedValueOnce(existing);
    mockUpdate.mockResolvedValueOnce(updated);

    const res = await PATCH(makeRequest("PATCH", { role: "admin" }), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("admin");
  });
});

describe("DELETE /api/access/allowlist/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 404 for unknown id", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await DELETE(makeRequest("DELETE"), { params });
    expect(res.status).toBe(404);
  });

  it("soft-deletes by setting isActive to false", async () => {
    const existing = { id: "test-id", email: "a@b.com", role: "member", isActive: true };
    const deactivated = { ...existing, isActive: false };
    mockFindUnique.mockResolvedValueOnce(existing);
    mockUpdate.mockResolvedValueOnce(deactivated);

    const res = await DELETE(makeRequest("DELETE"), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isActive).toBe(false);
  });
});
