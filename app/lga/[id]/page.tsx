import { notFound } from "next/navigation";
import { loadLgaById, loadDealsForList, loadSectorOpportunities, loadStrategies } from "@/lib/db/queries";
import { LgaDetail } from "@/components/lga/LgaDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LgaDetailPage({ params }: Props) {
  const { id } = await params;

  const [lga, allDeals, sectorOpportunities, strategies] =
    await Promise.all([
      loadLgaById(id),
      loadDealsForList(),
      loadSectorOpportunities(),
      loadStrategies(),
    ]);

  if (!lga) notFound();

  /* Filter deals that belong to this LGA */
  const linkedDeals = allDeals.filter((d) => d.lgaIds.includes(id));

  /* Find strategies whose priority sectors overlap with sectors active in this LGA.
     Sector mapping: each deal's opportunityTypeId maps to a sectorOpportunityId via OPP_TYPE_TO_SECTOR. */
  const activeSectorIds = new Set<string>();
  const { OPP_TYPE_TO_SECTOR } = await import("@/lib/colour-system");
  for (const deal of linkedDeals) {
    const soId = OPP_TYPE_TO_SECTOR[deal.opportunityTypeId];
    if (soId) activeSectorIds.add(soId);
  }
  const linkedStrategies = strategies.filter((s) =>
    s.prioritySectorIds.some((psId) => activeSectorIds.has(psId)),
  );

  return (
    <div>
      <h1 className="sr-only">LGA detail</h1>
      <LgaDetail
        lga={lga}
        linkedDeals={linkedDeals}
        sectorOpportunities={sectorOpportunities}
        linkedStrategies={linkedStrategies}
      />
    </div>
  );
}
