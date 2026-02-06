import { notFound } from "next/navigation";
import { loadPageData } from "@/lib/load-page-data";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { lgas, deals, opportunityTypes } = await loadPageData("opportunity detail");

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
