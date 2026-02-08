import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "./route";

const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dealDocument: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

const mockRequireAuth = vi.fn();
const mockRateLimit = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  requireAuthOrResponse: (...args: unknown[]) => mockRequireAuth(...args),
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
}));

const mockDeleteFromBlob = vi.fn();
vi.mock("@/lib/blob-storage", () => ({
  deleteFromBlob: (...args: unknown[]) => mockDeleteFromBlob(...args),
}));

vi.mock("@/lib/validations", () => ({
  IdParamSchema: { safeParse: () => ({ success: true }) },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("GET /api/deals/:id/documents/:docId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it("redirects to blob URL", async () => {
    mockFindUnique.mockResolvedValueOnce({ fileUrl: "https://example.com/doc.pdf" });
    const res = await GET(
      new Request("http://localhost/api/deals/d1/documents/doc-1"),
      { params: Promise.resolve({ id: "d1", docId: "doc-1" }) },
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/doc.pdf");
  });
});

describe("DELETE /api/deals/:id/documents/:docId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
  });

  it("deletes a document", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "doc-1",
      fileUrl: "https://example.com/doc.pdf",
    });
    const res = await DELETE(
      new Request("http://localhost/api/deals/d1/documents/doc-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "d1", docId: "doc-1" }) },
    );
    expect(res.status).toBe(200);
  });
});
