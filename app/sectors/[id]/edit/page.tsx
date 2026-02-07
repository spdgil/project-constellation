import { notFound } from "next/navigation";
import { loadSectorOpportunityById } from "@/lib/db/queries";
import { SectorOpportunityEdit } from "@/components/sectors/SectorOpportunityEdit";

interface EditSectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSectorPage({ params }: EditSectorPageProps) {
  const { id } = await params;
  const sectorOpportunity = await loadSectorOpportunityById(id);

  if (!sectorOpportunity) {
    notFound();
  }

  return <SectorOpportunityEdit sectorOpportunity={sectorOpportunity} />;
}
