import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  isAuthConfigured: true,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  rateLimitKeyFromRequest: vi.fn().mockReturnValue("test"),
}));

vi.mock("@/lib/request-utils", () => ({
  readJsonWithLimit: vi.fn(),
}));

describe("requireAdminOrResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { requireAdminOrResponse } = await import("@/lib/api-guards");
    const res = await requireAdminOrResponse();
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    mockAuth
      .mockResolvedValueOnce({ user: { email: "user@example.com", role: "member" } })
      .mockResolvedValueOnce({ user: { email: "user@example.com", role: "member" } });
    const { requireAdminOrResponse } = await import("@/lib/api-guards");
    const res = await requireAdminOrResponse();
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("returns null when user is admin", async () => {
    mockAuth
      .mockResolvedValueOnce({ user: { email: "admin@example.com", role: "admin" } })
      .mockResolvedValueOnce({ user: { email: "admin@example.com", role: "admin" } });
    const { requireAdminOrResponse } = await import("@/lib/api-guards");
    const res = await requireAdminOrResponse();
    expect(res).toBeNull();
  });
});
