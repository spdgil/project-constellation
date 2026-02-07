import { notFound } from "next/navigation";
import { loadDealById, loadDeals, loadLgas, loadOpportunityTypes } from "@/lib/db/queries";
import { DealDetail } from "@/components/deals/DealDetail";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;

  const [deal, opportunityTypes, lgas, allDeals] = await Promise.all([
    loadDealById(id),
    loadOpportunityTypes(),
    loadLgas(),
    loadDeals(),
  ]);

  if (!deal) {
    notFound();
  }

  return (
    <DealDetail
      deal={deal}
      dealId={id}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
      allDeals={allDeals}
    />
  );
}
