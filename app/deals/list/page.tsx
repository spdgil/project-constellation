import { loadPageDataWithDealPaging } from "@/lib/load-page-data";
import { DealsSearch } from "@/components/deals/DealsSearch";

export default async function DealsListPage() {
  const { lgas, deals, opportunityTypes, sectorOpportunities, dealTotal, dealLimit, dealOffset } =
    await loadPageDataWithDealPaging("deals list", { limit: 50, offset: 0 });

  return (
    <DealsSearch
      deals={deals}
      opportunityTypes={opportunityTypes}
      lgas={lgas}
      sectorCount={sectorOpportunities.length}
      dealTotal={dealTotal}
      dealLimit={dealLimit}
      dealOffset={dealOffset}
    />
  );
}
