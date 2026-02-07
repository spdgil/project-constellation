import { LgaTabBar } from "@/components/lga/LgaTabBar";
import { PipelineSummaryBar } from "@/components/ui/PipelineSummaryBar";
import { loadPageData } from "@/lib/load-page-data";

export default async function LgaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { deals, sectorOpportunities } = await loadPageData("lga layout");

  let investment = 0;
  let impact = 0;
  let jobs = 0;
  for (const d of deals) {
    investment += d.investmentValueAmount ?? 0;
    impact += d.economicImpactAmount ?? 0;
    jobs += d.economicImpactJobs ?? 0;
  }

  return (
    <div className="flex flex-col gap-6">
      <LgaTabBar />
      <PipelineSummaryBar
        sectorCount={sectorOpportunities.length}
        dealCount={deals.length}
        investment={investment}
        impact={impact}
        jobs={jobs}
      />
      {children}
    </div>
  );
}
