import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

const mockFindMany = vi.fn();
const mockUpsert = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    allowedEmail: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
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

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost/api/access/allowlist", {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("GET /api/access/allowlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 403 when not admin", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns all allowlisted emails", async () => {
    const entries = [
      { id: "1", email: "admin@example.com", role: "admin", isActive: true },
      { id: "2", email: "user@example.com", role: "member", isActive: true },
    ];
    mockFindMany.mockResolvedValueOnce(entries);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].email).toBe("admin@example.com");
  });
});

describe("POST /api/access/allowlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns 403 when not admin", async () => {
    mockRequireAdmin.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    );
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid email", async () => {
    mockReadJson.mockResolvedValueOnce({ data: { email: "not-an-email" } });
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("creates an allowlisted email entry", async () => {
    const created = { id: "new", email: "new@example.com", role: "member", isActive: true };
    mockReadJson.mockResolvedValueOnce({ data: { email: "New@Example.com" } });
    mockUpsert.mockResolvedValueOnce(created);

    const res = await POST(makeRequest({ email: "New@Example.com" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe("new@example.com");
  });
});
