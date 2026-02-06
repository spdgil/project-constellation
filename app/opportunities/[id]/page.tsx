import { notFound } from "next/navigation";
import { loadLgas, loadDeals, loadOpportunityTypes } from "@/lib/data";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lgas, deals, opportunityTypes] = await Promise.all([
    loadLgas(),
    loadDeals(),
    loadOpportunityTypes(),
  ]);

  const opportunityType = opportunityTypes.find((o) => o.id === id);
  if (!opportunityType) notFound();

  return (
    <OpportunityDetail
      opportunityType={opportunityType}
      deals={deals}
      lgas={lgas}
    />
  );
}
