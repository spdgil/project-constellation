import { loadPageData } from "@/lib/load-page-data";
import { DealsAnalysis } from "@/components/deals/DealsAnalysis";

export default async function DealsAnalysisPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("deals analysis");

  return (
    <DealsAnalysis
      deals={deals}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
    />
  );
}
