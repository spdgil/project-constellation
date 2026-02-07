import { loadPageData } from "@/lib/load-page-data";
import { DealsSearch } from "@/components/deals/DealsSearch";

export default async function DealsListPage() {
  const { lgas, deals, opportunityTypes, sectorOpportunities } =
    await loadPageData("deals list");

  return (
    <DealsSearch
      deals={deals}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
      sectorCount={sectorOpportunities.length}
    />
  );
}
