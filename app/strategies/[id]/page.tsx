import { notFound } from "next/navigation";
import {
  loadStrategyById,
  loadStrategyGrade,
  loadSectorOpportunities,
} from "@/lib/db/queries";
import { StrategyDetail } from "@/components/strategies/StrategyDetail";

interface StrategyPageProps {
  params: Promise<{ id: string }>;
}

export default async function StrategyPage({ params }: StrategyPageProps) {
  const { id } = await params;

  const [strategy, grade, sectorOpportunities] = await Promise.all([
    loadStrategyById(id),
    loadStrategyGrade(id),
    loadSectorOpportunities(),
  ]);

  if (!strategy) {
    notFound();
  }

  return (
    <StrategyDetail
      strategy={strategy}
      grade={grade}
      sectorOpportunities={sectorOpportunities}
    />
  );
}
