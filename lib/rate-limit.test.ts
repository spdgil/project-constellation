import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, rateLimitKeyFromRequest } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enforces limits within the window", async () => {
    const key = "test-key";
    const windowMs = 1000;

    const first = await checkRateLimit(key, 2, windowMs);
    const second = await checkRateLimit(key, 2, windowMs);
    const third = await checkRateLimit(key, 2, windowMs);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    const key = "reset-key";
    const windowMs = 1000;

    await checkRateLimit(key, 1, windowMs);
    const blocked = await checkRateLimit(key, 1, windowMs);
    expect(blocked.allowed).toBe(false);

    vi.setSystemTime(new Date(2000));
    const allowed = await checkRateLimit(key, 1, windowMs);
    expect(allowed.allowed).toBe(true);
  });

  it("uses a validated forwarded IP if present", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    expect(rateLimitKeyFromRequest(req)).toBe("203.0.113.10");
  });

  it("falls back to anonymous on invalid forwarded IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "not-an-ip" },
    });
    expect(rateLimitKeyFromRequest(req)).toBe("anonymous");
  });
});
