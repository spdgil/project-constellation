import { loadPageData } from "@/lib/load-page-data";
import { MapPageView } from "@/components/lga/MapPageView";

export default async function LgaMapPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("lga map");

  return (
    <div>
      <h1 className="sr-only">LGA map</h1>
      <MapPageView
        lgas={lgas}
        deals={deals}
        opportunityTypes={opportunityTypes}
      />
    </div>
  );
}
