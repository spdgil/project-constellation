import { notFound } from "next/navigation";
import {
  loadDealById,
  loadDealsForList,
  loadLgas,
  loadOpportunityTypes,
  loadSectorOpportunities,
} from "@/lib/db/queries";
import { DealDetail } from "@/components/deals/DealDetail";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;

  const [deal, opportunityTypes, lgas, allDeals, sectorOpportunities] =
    await Promise.all([
      loadDealById(id),
      loadOpportunityTypes(),
      loadLgas(),
      loadDealsForList(),
      loadSectorOpportunities(),
    ]);

  if (!deal) {
    notFound();
  }

  return (
    <div>
      <h1 className="sr-only">Deal details</h1>
      <DealDetail
        deal={deal}
        dealId={id}
        opportunityTypes={opportunityTypes}
        lgas={lgas}
        allDeals={allDeals}
        sectorOpportunities={sectorOpportunities}
      />
    </div>
  );
}
