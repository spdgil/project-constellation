/**
 * Shared server-side data loader for pages that need LGAs, deals, and opportunity types.
 * Now loads from PostgreSQL via Prisma instead of static JSON files.
 */

import {
  loadLgas,
  loadDealsForMap,
  loadDealsForList,
  countDeals,
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
  sectorOpportunities: SectorOpportunity[];
}

export interface PageDataWithStrategies extends PageData {
  sectorOpportunities: SectorOpportunity[];
  strategies: SectorDevelopmentStrategy[];
  strategyGrades: StrategyGrade[];
}

export interface PageDataWithDealPaging extends PageData {
  dealTotal: number;
  dealOffset: number;
  dealLimit: number;
}

/** Load core page data (LGAs, deals, opportunity types, sector opportunities) from the database. */
export async function loadPageData(pageName: string): Promise<PageData> {
  try {
    const [lgas, deals, opportunityTypes, sectorOpportunities] = await Promise.all([
      loadLgas(),
      loadDealsForMap(),
      loadOpportunityTypes(),
      loadSectorOpportunities(),
    ]);
    return { lgas, deals, opportunityTypes, sectorOpportunities };
  } catch (error) {
    throw new Error(
      `Failed to load ${pageName} data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Load page data with paged deals (for deals list). */
export async function loadPageDataWithDealPaging(
  pageName: string,
  options: { limit: number; offset: number },
): Promise<PageDataWithDealPaging> {
  try {
    const [lgas, deals, opportunityTypes, sectorOpportunities, dealTotal] =
      await Promise.all([
        loadLgas(),
        loadDealsForList({ limit: options.limit, offset: options.offset }),
        loadOpportunityTypes(),
        loadSectorOpportunities(),
        countDeals(),
      ]);
    return {
      lgas,
      deals,
      opportunityTypes,
      sectorOpportunities,
      dealTotal,
      dealOffset: options.offset,
      dealLimit: options.limit,
    };
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
        loadDealsForMap(),
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
