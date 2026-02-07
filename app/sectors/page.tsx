import { loadSectorOpportunities } from "@/lib/db/queries";
import { SectorOpportunitiesIndex } from "@/components/sectors/SectorOpportunitiesIndex";

export default async function SectorsPage() {
  const sectorOpportunities = await loadSectorOpportunities();

  return <SectorOpportunitiesIndex sectorOpportunities={sectorOpportunities} />;
}
