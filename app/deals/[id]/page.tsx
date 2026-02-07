import { loadPageData } from "@/lib/load-page-data";
import { DealDetail } from "@/components/deals/DealDetail";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;
  const { deals, opportunityTypes, lgas } = await loadPageData("deal detail");

  // Deal may exist in static JSON or only in localStorage (AI-created deals).
  // Pass null and let the client component resolve from local storage.
  const deal = deals.find((d) => d.id === id) ?? null;

  return (
    <DealDetail
      deal={deal}
      dealId={id}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
      allDeals={deals}
    />
  );
}
