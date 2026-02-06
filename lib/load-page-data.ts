/**
 * Shared server-side data loader for pages that need LGAs, deals, and opportunity types.
 * Eliminates repeated try/catch + Promise.all boilerplate across 6 page routes.
 */

import { loadLgas, loadDeals, loadOpportunityTypes } from "./data";
import type { LGA, Deal, OpportunityType } from "./types";

export interface PageData {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
}

/** Load core page data (LGAs, deals, opportunity types) with error wrapping. */
export async function loadPageData(pageName: string): Promise<PageData> {
  try {
    const [lgas, deals, opportunityTypes] = await Promise.all([
      loadLgas(),
      loadDeals(),
      loadOpportunityTypes(),
    ]);
    return { lgas, deals, opportunityTypes };
  } catch (error) {
    throw new Error(
      `Failed to load ${pageName} data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
