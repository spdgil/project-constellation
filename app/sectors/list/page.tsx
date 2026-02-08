import {
  loadSectorOpportunities,
  loadDeals,
  loadStrategies,
} from "@/lib/db/queries";
import { SectorOpportunitiesIndex } from "@/components/sectors/SectorOpportunitiesIndex";
import type { Deal, SectorDevelopmentStrategy } from "@/lib/types";
import { OPP_TYPE_TO_SECTOR } from "@/lib/colour-system";

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

export default async function SectorsListPage() {
  const [sectorOpportunities, deals, strategies] = await Promise.all([
    loadSectorOpportunities(),
    loadDeals(),
    loadStrategies(),
  ]);

  const sectorStats = buildSectorStats(deals, strategies);

  return (
    <div>
      <h1 className="sr-only">Sector opportunities</h1>
      <SectorOpportunitiesIndex
        sectorOpportunities={sectorOpportunities}
        sectorStats={sectorStats}
        totalDeals={deals.length}
        totalStrategies={strategies.length}
      />
    </div>
  );
}
