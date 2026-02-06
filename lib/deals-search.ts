/**
 * Filter deals by search query (name, opportunity type, LGA name).
 */

import type { Deal, LGA, OpportunityType } from "./types";
import { dealLgaNames } from "./opportunities";

export function filterDealsByQuery(
  deals: Deal[],
  query: string,
  opportunityTypes: OpportunityType[],
  lgas: LGA[]
): Deal[] {
  const q = query.trim().toLowerCase();
  if (!q) return deals;

  return deals.filter((deal) => {
    if (deal.name.toLowerCase().includes(q)) return true;
    const ot = opportunityTypes.find((o) => o.id === deal.opportunityTypeId);
    if (ot?.name.toLowerCase().includes(q)) return true;
    const names = dealLgaNames(deal, lgas);
    if (names.some((name) => name.toLowerCase().includes(q))) return true;
    return false;
  });
}
