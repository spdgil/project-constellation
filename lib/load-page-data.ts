/**
 * Shared server-side data loader for pages that need LGAs, deals, and opportunity types.
 * Now loads from PostgreSQL via Prisma instead of static JSON files.
 */

import {
  loadLgas,
  loadDeals,
  loadOpportunityTypes,
} from "@/lib/db/queries";
import type { LGA, Deal, OpportunityType } from "./types";

export interface PageData {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
}

/** Load core page data (LGAs, deals, opportunity types) from the database. */
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
