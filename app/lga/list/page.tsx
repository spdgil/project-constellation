import { loadPageData } from "@/lib/load-page-data";
import { LgaList } from "@/components/lga/LgaList";

export default async function LgaListPage() {
  const { lgas, deals, opportunityTypes, sectorOpportunities } =
    await loadPageData("lga list");

  return (
    <LgaList
      lgas={lgas}
      deals={deals}
      opportunityTypes={opportunityTypes}
      sectorCount={sectorOpportunities.length}
    />
  );
}
