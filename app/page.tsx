import { loadPageData } from "@/lib/load-page-data";
import { HomeView } from "@/components/home/HomeView";

export default async function HomePage() {
  const { deals } = await loadPageData("home page");

  return <HomeView deals={deals} />;
}
