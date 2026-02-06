import { loadLgas, loadDeals, loadOpportunityTypes } from "@/lib/data";
import { DealsSearch } from "@/components/deals/DealsSearch";

export default async function DealsPage() {
  const [lgas, deals, opportunityTypes] = await Promise.all([
    loadLgas(),
    loadDeals(),
    loadOpportunityTypes(),
  ]);

  return (
    <DealsSearch
      deals={deals}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
    />
  );
}
