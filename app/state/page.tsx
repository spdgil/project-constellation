import { loadLgas, loadDeals, loadOpportunityTypes } from "@/lib/data";
import { StateView } from "@/components/state/StateView";

export default async function StatePage() {
  const [lgas, deals, opportunityTypes] = await Promise.all([
    loadLgas(),
    loadDeals(),
    loadOpportunityTypes(),
  ]);

  return (
    <StateView
      opportunityTypes={opportunityTypes}
      deals={deals}
      lgas={lgas}
    />
  );
}
