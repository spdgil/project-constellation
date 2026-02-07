import { loadPageData } from "@/lib/load-page-data";
import { MapPageView } from "@/components/lga/MapPageView";

export default async function LgaMapPage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("lga map");

  return (
    <MapPageView lgas={lgas} deals={deals} opportunityTypes={opportunityTypes} />
  );
}
