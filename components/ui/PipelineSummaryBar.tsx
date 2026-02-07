import { formatAUD } from "@/lib/colour-system";
import { SummaryCard } from "./SummaryCard";

export interface PipelineSummaryBarProps {
  /** Number of priority sector opportunities */
  sectorCount: number;
  /** Number of active deals */
  dealCount: number;
  /** Total investment value (AUD) */
  investment: number;
  /** Total economic impact (AUD) */
  impact: number;
  /** Total jobs identified */
  jobs: number;
}

/**
 * Standard 5-metric summary bar used across LGA, Sectors, and Deals pages.
 * Shows: Sectors, Active Deals, Investment, Economic Impact, Jobs.
 */
export function PipelineSummaryBar({
  sectorCount,
  dealCount,
  investment,
  impact,
  jobs,
}: PipelineSummaryBarProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      data-testid="summary-bar"
    >
      <SummaryCard
        label="Sectors"
        value={String(sectorCount)}
        sub="priority opportunities"
        colour="violet"
      />
      <SummaryCard
        label="Active deals"
        value={String(dealCount)}
        sub="across all sectors"
        colour="blue"
      />
      <SummaryCard
        label="Investment"
        value={investment > 0 ? formatAUD(investment) : "—"}
        sub="total deal value"
        colour="amber"
      />
      <SummaryCard
        label="Economic impact"
        value={impact > 0 ? formatAUD(impact) : "—"}
        sub="projected GDP contribution"
        colour="emerald"
      />
      <SummaryCard
        label="Jobs identified"
        value={jobs > 0 ? jobs.toLocaleString() : "—"}
        sub="across active deals"
        colour="emerald"
      />
    </div>
  );
}
