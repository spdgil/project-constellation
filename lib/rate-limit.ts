/**
 * Simple in-memory rate limiter using a sliding window.
 * Suitable for single-instance deployments (Vercel serverless).
 * For multi-region, consider @upstash/ratelimit + Vercel KV.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check whether a given key has exceeded the rate limit.
 *
 * @param key - Unique identifier (e.g. IP address, user ID)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with `allowed` boolean and `retryAfterMs` (0 if allowed)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0]!;
    const retryAfterMs = windowMs - (now - oldest);
    store.set(key, entry);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Extract a rate-limit key from a request (uses x-forwarded-for or fallback).
 */
export function rateLimitKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "anonymous";
}
