import { loadPageData } from "@/lib/load-page-data";
import { LgaList } from "@/components/lga/LgaList";

export default async function LgaListPage() {
  const { lgas, deals, opportunityTypes, sectorOpportunities } =
    await loadPageData("lga list");

  return (
    <div>
      <h1 className="sr-only">LGA list</h1>
      <LgaList
        lgas={lgas}
        deals={deals}
        opportunityTypes={opportunityTypes}
        sectorCount={sectorOpportunities.length}
      />
    </div>
  );
}
