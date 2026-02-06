import { loadPageData } from "@/lib/load-page-data";
import { StateView } from "@/components/state/StateView";

export default async function StatePage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("state page");

  return (
    <StateView
      opportunityTypes={opportunityTypes}
      deals={deals}
      lgas={lgas}
    />
  );
}
