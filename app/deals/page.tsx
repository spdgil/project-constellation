import { loadPageData } from "@/lib/load-page-data";
import { DealsSearch } from "@/components/deals/DealsSearch";

export default async function DealsPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("deals page");

  return (
    <DealsSearch
      deals={deals}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
    />
  );
}
