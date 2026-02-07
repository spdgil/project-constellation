import { loadPageData } from "@/lib/load-page-data";
import { HomeView } from "@/components/home/HomeView";

interface HomePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { lgas, deals, opportunityTypes } = await loadPageData("home page");
  const params = await searchParams;
  const tab = params.tab === "map" ? "map" : "overview";

  return (
    <HomeView
      opportunityTypes={opportunityTypes}
      deals={deals}
      lgas={lgas}
      initialTab={tab}
    />
  );
}
