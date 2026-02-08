import { describe, it, expect, vi } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock("@/lib/auth", () => ({
  handlers: {
    GET: mockGet,
    POST: mockPost,
  },
}));

describe("/api/auth/[...nextauth]", () => {
  it("exports GET and POST handlers", async () => {
    const mod = await import("./route");
    expect(mod.GET).toBe(mockGet);
    expect(mod.POST).toBe(mockPost);
  });
});
