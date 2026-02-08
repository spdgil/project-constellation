import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    strategyDocument: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    sectorDevelopmentStrategy: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

const mockRequireAuth = vi.fn();
const mockRateLimit = vi.fn();
vi.mock("@/lib/api-guards", () => ({
  requireAuthOrResponse: (...args: unknown[]) => mockRequireAuth(...args),
  rateLimitOrResponse: (...args: unknown[]) => mockRateLimit(...args),
}));

const mockValidateUploadedFile = vi.fn();
vi.mock("@/lib/validations", () => ({
  validateUploadedFile: (...args: unknown[]) => mockValidateUploadedFile(...args),
  IdParamSchema: { safeParse: () => ({ success: true }) },
}));

const mockUploadToBlob = vi.fn();
vi.mock("@/lib/blob-storage", () => ({
  uploadToBlob: (...args: unknown[]) => mockUploadToBlob(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("GET /api/strategies/:id/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it("returns documents", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "doc-1",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        sizeBytes: 123,
        fileUrl: "https://example.com",
        label: "Test",
        addedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    const res = await GET(new Request("http://localhost/api/strategies/s1/documents"), {
      params: Promise.resolve({ id: "s1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/strategies/:id/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue(null);
    mockValidateUploadedFile.mockReturnValue(null);
  });

  it("uploads a document", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "s1" });
    mockUploadToBlob.mockResolvedValueOnce("https://example.com/doc.pdf");
    mockCreate.mockResolvedValueOnce({
      id: "doc-1",
      fileName: "doc.pdf",
      mimeType: "application/pdf",
      sizeBytes: 10,
      fileUrl: "https://example.com/doc.pdf",
      label: "Doc",
      addedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["file"], "doc.pdf", { type: "application/pdf" }),
    );
    formData.append("label", "Doc");

    const res = await POST(
      new Request("http://localhost/api/strategies/s1/documents", {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );
    expect(res.status).toBe(201);
  });
});
