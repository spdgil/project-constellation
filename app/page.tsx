import { loadDeals } from "@/lib/db/queries";
import { HomeView } from "@/components/home/HomeView";

export default async function HomePage() {
  const deals = await loadDeals();

  return (
    <div>
      <h1 className="sr-only">Home</h1>
      <HomeView deals={deals} />
    </div>
  );
}
