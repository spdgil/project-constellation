import { loadPageData } from "@/lib/load-page-data";
import { DealsAnalysis } from "@/components/deals/DealsAnalysis";

export default async function DealsAnalysisPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("deals analysis");

  return (
    <div>
      <h1 className="sr-only">Deals analysis</h1>
      <DealsAnalysis
        deals={deals}
        opportunityTypes={opportunityTypes}
        lgas={lgas}
      />
    </div>
  );
}
