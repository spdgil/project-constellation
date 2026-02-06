import {
  loadLgas,
  loadDeals,
  loadOpportunityTypes,
  loadQldLgaBoundaries,
} from "@/lib/data";
import { MapView } from "@/components/map/MapView";

export default async function MapPage() {
  const [lgas, deals, opportunityTypes, boundaries] = await Promise.all([
    loadLgas(),
    loadDeals(),
    loadOpportunityTypes(),
    loadQldLgaBoundaries(),
  ]);

  return (
    <MapView
      lgas={lgas}
      deals={deals}
      opportunityTypes={opportunityTypes}
      boundaries={boundaries}
    />
  );
}
