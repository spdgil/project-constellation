"use client";

/**
 * Custom hook to merge server-loaded deals with localStorage overrides.
 * Eliminates the repeated useEffect + useState pattern across 4 components.
 */

import { useEffect, useState } from "react";
import type { Deal } from "@/lib/types";
import { getDealsWithLocalOverrides } from "@/lib/deal-storage";

/** Returns deals with any localStorage overrides applied. */
export function useDealsWithOverrides(baseDeals: Deal[]): Deal[] {
  const [deals, setDeals] = useState<Deal[]>(baseDeals);

  useEffect(() => {
    setDeals(getDealsWithLocalOverrides(baseDeals));
  }, [baseDeals]);

  return deals;
}
