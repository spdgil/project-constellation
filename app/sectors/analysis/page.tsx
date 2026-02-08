import { loadPageData } from "@/lib/load-page-data";
import { SectorsAnalysis } from "@/components/sectors/SectorsAnalysis";

export default async function SectorsAnalysisPage() {
  const { deals, sectorOpportunities } = await loadPageData("sectors analysis");

  return (
    <div>
      <h1 className="sr-only">Sectors analysis</h1>
      <SectorsAnalysis
        deals={deals}
        sectorOpportunities={sectorOpportunities}
        sectorCount={sectorOpportunities.length}
      />
    </div>
  );
}
