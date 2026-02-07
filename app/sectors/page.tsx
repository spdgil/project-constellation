import {
  loadSectorOpportunities,
  loadDeals,
  loadStrategies,
} from "@/lib/db/queries";
import { SectorOpportunitiesIndex } from "@/components/sectors/SectorOpportunitiesIndex";
import type { Deal, SectorDevelopmentStrategy } from "@/lib/types";

/**
 * Map an opportunity-type ID (on deals) to the corresponding sector-opportunity
 * ID so we can aggregate deal stats per sector.
 */
const OPP_TYPE_TO_SECTOR: Record<string, string> = {
  "critical-minerals": "sector_opportunity_critical_minerals_value_chain",
  "renewable-energy": "sector_opportunity_renewable_energy_services",
  bioenergy: "sector_opportunity_bioenergy_biofuels",
  biomanufacturing: "sector_opportunity_biomanufacturing",
  "circular-economy": "sector_opportunity_circular_economy_mining_industrial",
  space: "sector_opportunity_space_industrial_support",
  "post-mining-land-use": "sector_opportunity_post_mining_land_use",
};

export interface SectorStats {
  dealCount: number;
  totalInvestment: number;
  totalEconomicImpact: number;
  totalJobs: number;
  strategyCount: number;
}

function buildSectorStats(
  deals: Deal[],
  strategies: SectorDevelopmentStrategy[],
): Record<string, SectorStats> {
  const stats: Record<string, SectorStats> = {};

  for (const deal of deals) {
    const sectorId = OPP_TYPE_TO_SECTOR[deal.opportunityTypeId];
    if (!sectorId) continue;
    if (!stats[sectorId]) {
      stats[sectorId] = {
        dealCount: 0,
        totalInvestment: 0,
        totalEconomicImpact: 0,
        totalJobs: 0,
        strategyCount: 0,
      };
    }
    stats[sectorId].dealCount += 1;
    stats[sectorId].totalInvestment += deal.investmentValueAmount ?? 0;
    stats[sectorId].totalEconomicImpact += deal.economicImpactAmount ?? 0;
    stats[sectorId].totalJobs += deal.economicImpactJobs ?? 0;
  }

  for (const strategy of strategies) {
    for (const sectorId of strategy.prioritySectorIds) {
      if (!stats[sectorId]) {
        stats[sectorId] = {
          dealCount: 0,
          totalInvestment: 0,
          totalEconomicImpact: 0,
          totalJobs: 0,
          strategyCount: 0,
        };
      }
      stats[sectorId].strategyCount += 1;
    }
  }

  return stats;
}

export default async function SectorsPage() {
  const [sectorOpportunities, deals, strategies] = await Promise.all([
    loadSectorOpportunities(),
    loadDeals(),
    loadStrategies(),
  ]);

  const sectorStats = buildSectorStats(deals, strategies);

  return (
    <SectorOpportunitiesIndex
      sectorOpportunities={sectorOpportunities}
      sectorStats={sectorStats}
      totalDeals={deals.length}
      totalStrategies={strategies.length}
    />
  );
}
