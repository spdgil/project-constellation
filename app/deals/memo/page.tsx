import { loadPageData } from "@/lib/load-page-data";
import { InvestmentMemo } from "@/components/deals/InvestmentMemo";

export default async function InvestmentMemoPage() {
  const { lgas, opportunityTypes } = await loadPageData("investment memo");

  return (
    <div>
      <h1 className="sr-only">Investment memo</h1>
      <InvestmentMemo
        opportunityTypes={opportunityTypes}
        lgas={lgas}
      />
    </div>
  );
}
