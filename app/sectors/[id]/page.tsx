import { notFound } from "next/navigation";
import {
  loadSectorOpportunityById,
  loadStrategies,
} from "@/lib/db/queries";
import { SectorOpportunityDetail } from "@/components/sectors/SectorOpportunityDetail";

interface SectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function SectorPage({ params }: SectorPageProps) {
  const { id } = await params;

  const [sectorOpportunity, strategies] = await Promise.all([
    loadSectorOpportunityById(id),
    loadStrategies(),
  ]);

  if (!sectorOpportunity) {
    notFound();
  }

  // Find strategies that reference this sector opportunity
  const linkedStrategies = strategies.filter((s) =>
    s.prioritySectorIds.includes(sectorOpportunity.id),
  );

  return (
    <SectorOpportunityDetail
      sectorOpportunity={sectorOpportunity}
      linkedStrategies={linkedStrategies}
    />
  );
}
