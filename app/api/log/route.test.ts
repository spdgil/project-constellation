import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/log", () => {
  it("accepts a valid log entry", async () => {
    const res = await POST(makeRequest({ level: "info", message: "hello" }));
    expect(res.status).toBe(200);
  });

  it("rejects invalid log level", async () => {
    const res = await POST(makeRequest({ level: "debug", message: "nope" }));
    expect(res.status).toBe(400);
  });

  it("rejects oversized payloads", async () => {
    const oversized = "x".repeat(11_000);
    const res = await POST(
      makeRequest({ level: "warn", message: oversized }),
    );
    expect(res.status).toBe(413);
  });
});
