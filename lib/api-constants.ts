/**
 * Shared constants for API route configuration.
 */

/** Default rate limit window in milliseconds. */
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Rate limits by operation type (requests per window). */
export const RATE_LIMITS = {
  read: 120,
  write: 30,
  delete: 20,
  ai: 10,
  geocode: 30,
  log: 30,
  upload: 20,
} as const;

/** Maximum JSON body size in bytes by route type. */
export const MAX_BODY_BYTES = {
  standard: 262_144,   // 256 KB
  small: 131_072,      // 128 KB
  ai: 1_000_000,       // 1 MB
  log: 10_240,         // 10 KB
  geocode: 4_096,      // 4 KB
} as const;
