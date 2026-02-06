/**
 * Filter deals by search query and optional facet filters.
 */

import type { Deal, DealStage, LGA, OpportunityType } from "./types";
import { dealLgaNames } from "./opportunities";

/** Optional faceted filter parameters (AND logic with text query). */
export interface DealFilterParams {
  stage?: DealStage;
  opportunityTypeId?: string;
  lgaId?: string;
}

export function filterDealsByQuery(
  deals: Deal[],
  query: string,
  opportunityTypes: OpportunityType[],
  lgas: LGA[],
  filters?: DealFilterParams,
): Deal[] {
  let result = deals;

  // Apply faceted filters first (cheap equality checks)
  if (filters?.stage) {
    result = result.filter((d) => d.stage === filters.stage);
  }
  if (filters?.opportunityTypeId) {
    result = result.filter((d) => d.opportunityTypeId === filters.opportunityTypeId);
  }
  if (filters?.lgaId) {
    result = result.filter((d) => d.lgaIds.includes(filters.lgaId!));
  }

  // Then apply text query
  const q = query.trim().toLowerCase();
  if (!q) return result;

  return result.filter((deal) => {
    if (deal.name.toLowerCase().includes(q)) return true;
    const ot = opportunityTypes.find((o) => o.id === deal.opportunityTypeId);
    if (ot?.name.toLowerCase().includes(q)) return true;
    const names = dealLgaNames(deal, lgas);
    if (names.some((name) => name.toLowerCase().includes(q))) return true;
    return false;
  });
}
