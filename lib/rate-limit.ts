/**
 * Rate limiter with Upstash (distributed) fallback to in-memory sliding window.
 * In production, configure UPSTASH_REDIS_REST_URL/TOKEN for shared limits.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

interface RateLimitEntry {
  timestamps: number[];
  lastSeen: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_IN_MEMORY_KEYS = 5_000;
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

const upstashEnabled = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

const upstashLimiter = upstashEnabled
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
    })
  : null;

/**
 * Check whether a given key has exceeded the rate limit.
 *
 * @param key - Unique identifier (e.g. IP address, user ID)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with `allowed` boolean and `retryAfterMs` (0 if allowed)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(key);
    if (!result.success) {
      const retryAfterMs = Math.max(0, result.reset - Date.now());
      return { allowed: false, retryAfterMs };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [], lastSeen: now };

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  entry.lastSeen = now;

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0]!;
    const retryAfterMs = windowMs - (now - oldest);
    store.set(key, entry);
    cleanupStore(now);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  cleanupStore(now);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Extract a rate-limit key from a request (uses x-forwarded-for or fallback).
 */
export function rateLimitKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const candidate = forwarded.split(",")[0]!.trim();
    if (isValidIp(candidate)) return candidate;
  }
  return "anonymous";
}

function cleanupStore(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    if (entry.timestamps.length === 0 && now - entry.lastSeen > CLEANUP_INTERVAL_MS) {
      store.delete(key);
    }
  }

  if (store.size <= MAX_IN_MEMORY_KEYS) return;

  const entries = Array.from(store.entries()).sort(
    (a, b) => a[1].lastSeen - b[1].lastSeen,
  );
  const overBy = store.size - MAX_IN_MEMORY_KEYS;
  for (let i = 0; i < overBy; i++) {
    store.delete(entries[i]![0]);
  }
}

function isValidIp(value: string): boolean {
  const ipv4 =
    /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(value) || ipv6.test(value);
}
