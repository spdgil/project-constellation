import { loadDeals } from "@/lib/db/queries";
import { HomeView } from "@/components/home/HomeView";

export default async function HomePage() {
  const deals = await loadDeals();

  return <HomeView deals={deals} />;
}
