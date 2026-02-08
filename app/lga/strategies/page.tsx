import {
  loadStrategies,
  loadStrategyGrades,
  loadSectorOpportunities,
} from "@/lib/db/queries";
import { StrategiesIndex } from "@/components/strategies/StrategiesIndex";

export default async function StrategiesPage() {
  const [strategies, strategyGrades, sectorOpportunities] = await Promise.all([
    loadStrategies(),
    loadStrategyGrades(),
    loadSectorOpportunities(),
  ]);

  return (
    <div>
      <h1 className="sr-only">Strategies</h1>
      <StrategiesIndex
        strategies={strategies}
        strategyGrades={strategyGrades}
        sectorOpportunities={sectorOpportunities}
      />
    </div>
  );
}
