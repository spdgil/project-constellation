import { loadLgas, loadDeals, loadOpportunityTypes } from "@/lib/data";
import { OpportunitiesIndex } from "@/components/opportunities/OpportunitiesIndex";

export default async function OpportunitiesPage() {
  const [lgas, deals, opportunityTypes] = await Promise.all([
    loadLgas(),
    loadDeals(),
    loadOpportunityTypes(),
  ]);

  return (
    <OpportunitiesIndex
      opportunityTypes={opportunityTypes}
      deals={deals}
      lgas={lgas}
    />
  );
}
