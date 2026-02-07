import { notFound } from "next/navigation";
import {
  loadSectorOpportunityById,
  loadStrategies,
  loadDeals,
  loadLgas,
} from "@/lib/db/queries";
import { SectorOpportunityDetail } from "@/components/sectors/SectorOpportunityDetail";
import { OPP_TYPE_TO_SECTOR } from "@/lib/colour-system";

interface SectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function SectorPage({ params }: SectorPageProps) {
  const { id } = await params;

  const [sectorOpportunity, strategies, deals, lgas] = await Promise.all([
    loadSectorOpportunityById(id),
    loadStrategies(),
    loadDeals(),
    loadLgas(),
  ]);

  if (!sectorOpportunity) {
    notFound();
  }

  // Strategies that reference this sector opportunity
  const linkedStrategies = strategies.filter((s) =>
    s.prioritySectorIds.includes(sectorOpportunity.id),
  );

  // Deals whose opportunity type maps to this sector
  const linkedDeals = deals.filter(
    (d) => OPP_TYPE_TO_SECTOR[d.opportunityTypeId] === sectorOpportunity.id,
  );

  // LGAs that contain any of the linked deals
  const lgaIdSet = new Set<string>();
  for (const d of linkedDeals) {
    for (const lgaId of d.lgaIds) lgaIdSet.add(lgaId);
  }
  const linkedLgas = lgas.filter((l) => lgaIdSet.has(l.id));

  return (
    <SectorOpportunityDetail
      sectorOpportunity={sectorOpportunity}
      linkedStrategies={linkedStrategies}
      linkedDeals={linkedDeals}
      linkedLgas={linkedLgas}
    />
  );
}
