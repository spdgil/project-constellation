"use client";

/**
 * Returns deals as-is. Previously merged localStorage overrides,
 * but all data now comes from the database.
 */
import type { Deal } from "@/lib/types";

export function useDealsWithOverrides(baseDeals: Deal[]): Deal[] {
  return baseDeals;
}
