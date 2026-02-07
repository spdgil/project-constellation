import { loadPageData } from "@/lib/load-page-data";
import { HomeView } from "@/components/home/HomeView";

export default async function HomePage() {
  const { lgas, deals, opportunityTypes } = await loadPageData("home page");

  return (
    <HomeView
      opportunityTypes={opportunityTypes}
      deals={deals}
      lgas={lgas}
    />
  );
}
