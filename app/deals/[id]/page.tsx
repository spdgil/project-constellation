import { notFound } from "next/navigation";
import { loadPageData } from "@/lib/load-page-data";
import { DealDetail } from "@/components/deals/DealDetail";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;
  const { deals, opportunityTypes, lgas } = await loadPageData("deal detail");

  const deal = deals.find((d) => d.id === id);
  if (!deal) return notFound();

  return (
    <DealDetail
      deal={deal}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
      allDeals={deals}
    />
  );
}
