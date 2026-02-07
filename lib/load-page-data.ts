/**
 * Shared server-side data loader for pages that need LGAs, deals, and opportunity types.
 * Now loads from PostgreSQL via Prisma instead of static JSON files.
 */

import {
  loadLgas,
  loadDeals,
  loadOpportunityTypes,
  loadSectorOpportunities,
  loadStrategies,
  loadStrategyGrades,
} from "@/lib/db/queries";
import type {
  LGA,
  Deal,
  OpportunityType,
  SectorOpportunity,
  SectorDevelopmentStrategy,
  StrategyGrade,
} from "./types";

export interface PageData {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
}

export interface PageDataWithStrategies extends PageData {
  sectorOpportunities: SectorOpportunity[];
  strategies: SectorDevelopmentStrategy[];
  strategyGrades: StrategyGrade[];
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

/** Load page data including sector opportunities and strategies. */
export async function loadPageDataWithStrategies(
  pageName: string,
): Promise<PageDataWithStrategies> {
  try {
    const [lgas, deals, opportunityTypes, sectorOpportunities, strategies, strategyGrades] =
      await Promise.all([
        loadLgas(),
        loadDeals(),
        loadOpportunityTypes(),
        loadSectorOpportunities(),
        loadStrategies(),
        loadStrategyGrades(),
      ]);
    return { lgas, deals, opportunityTypes, sectorOpportunities, strategies, strategyGrades };
  } catch (error) {
    throw new Error(
      `Failed to load ${pageName} data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
