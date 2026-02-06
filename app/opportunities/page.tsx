import { loadPageData } from "@/lib/load-page-data";
import { OpportunitiesIndex } from "@/components/opportunities/OpportunitiesIndex";

export default async function OpportunitiesPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("opportunities page");

  return (
    <OpportunitiesIndex
      opportunityTypes={opportunityTypes}
      deals={deals}
      lgas={lgas}
    />
  );
}
