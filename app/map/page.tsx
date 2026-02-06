import { loadPageData } from "@/lib/load-page-data";
import { MapView } from "@/components/map/MapView";

/**
 * Map page — loads core data server-side; boundaries are lazy-loaded
 * client-side via /api/boundaries to avoid shipping 900KB in the page bundle.
 */
export default async function MapPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("map page");

  return (
    <MapView
      lgas={lgas}
      deals={deals}
      opportunityTypes={opportunityTypes}
    />
  );
}
