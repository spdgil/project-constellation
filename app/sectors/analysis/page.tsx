import { loadPageData } from "@/lib/load-page-data";
import { SectorsAnalysis } from "@/components/sectors/SectorsAnalysis";

export default async function SectorsAnalysisPage() {
  const { lgas, deals, opportunityTypes, sectorOpportunities } =
    await loadPageData("sectors analysis");

  return (
    <SectorsAnalysis
      deals={deals}
      opportunityTypes={opportunityTypes}
      sectorOpportunities={sectorOpportunities}
      lgas={lgas}
      sectorCount={sectorOpportunities.length}
    />
  );
}
