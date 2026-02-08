"use client";

import { useMemo } from "react";
import type { Deal, DealStage, SectorOpportunity } from "@/lib/types";
import { STAGE_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES } from "@/lib/stage-colours";
import { STAGE_ORDER } from "@/lib/deal-pathway-utils";
import { OPP_TYPE_TO_SECTOR, formatAUD } from "@/lib/colour-system";
import { PipelineSummaryBar } from "@/components/ui/PipelineSummaryBar";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface SectorsAnalysisProps {
  deals: Deal[];
  sectorOpportunities: SectorOpportunity[];
  sectorCount: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function percentOf(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function StatCard({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="border border-[#E8E6E3] bg-[#FFFFFF] p-4">
      <p
        className={`text-2xl font-heading font-medium leading-none ${accent ?? "text-[#2C2C2C]"}`}
      >
        {value}
      </p>
      <p className="text-xs text-[#6B6B6B] mt-1.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function HorizontalBar({
  label,
  count,
  max,
  colourClass,
}: {
  label: string;
  count: number;
  max: number;
  colourClass: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#2C2C2C] w-48 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-6 bg-[#F5F3F0] relative overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${colourClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-[#6B6B6B] w-8 text-right tabular-nums">{count}</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[#E8E6E3] bg-[#FFFFFF]">
      <div className="border-b border-[#E8E6E3] px-5 py-3">
        <h3 className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Bar colours                                                                 */
/* -------------------------------------------------------------------------- */

const SECTOR_BAR_COLOURS: Record<string, string> = {
  sector_opportunity_critical_minerals_value_chain: "bg-amber-300",
  sector_opportunity_renewable_energy_services: "bg-emerald-300",
  sector_opportunity_bioenergy_biofuels: "bg-emerald-200",
  sector_opportunity_biomanufacturing: "bg-blue-300",
  sector_opportunity_circular_economy_mining_industrial: "bg-violet-300",
  sector_opportunity_space_industrial_support: "bg-blue-200",
  sector_opportunity_post_mining_land_use: "bg-amber-200",
};

const STAGE_BAR_COLOURS: Record<DealStage, string> = {
  definition: "bg-amber-200",
  "pre-feasibility": "bg-amber-300",
  feasibility: "bg-blue-300",
  structuring: "bg-violet-300",
  "transaction-close": "bg-emerald-300",
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function SectorsAnalysis({
  deals,
  sectorOpportunities,
  sectorCount,
}: SectorsAnalysisProps) {

  /* Pipeline stats for summary bar */
  const pipelineStats = useMemo(() => {
    let investment = 0;
    let impact = 0;
    let jobs = 0;
    for (const d of deals) {
      investment += d.investmentValueAmount ?? 0;
      impact += d.economicImpactAmount ?? 0;
      jobs += d.economicImpactJobs ?? 0;
    }
    return { investment, impact, jobs };
  }, [deals]);

  /* Per-sector aggregation */
  const sectorData = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        dealCount: number;
        investment: number;
        impact: number;
        jobs: number;
        stages: Partial<Record<DealStage, number>>;
        constraints: Partial<Record<string, number>>;
        lgaIds: Set<string>;
      }
    >();

    // Initialise from sector opportunities
    for (const so of sectorOpportunities) {
      map.set(so.id, {
        name: so.name,
        dealCount: 0,
        investment: 0,
        impact: 0,
        jobs: 0,
        stages: {},
        constraints: {},
        lgaIds: new Set(),
      });
    }

    // Aggregate deals
    for (const deal of deals) {
      const sectorId = OPP_TYPE_TO_SECTOR[deal.opportunityTypeId];
      if (!sectorId || !map.has(sectorId)) continue;
      const entry = map.get(sectorId)!;
      entry.dealCount += 1;
      entry.investment += deal.investmentValueAmount ?? 0;
      entry.impact += deal.economicImpactAmount ?? 0;
      entry.jobs += deal.economicImpactJobs ?? 0;
      entry.stages[deal.stage] = (entry.stages[deal.stage] ?? 0) + 1;
      if (deal.dominantConstraint) {
        entry.constraints[deal.dominantConstraint] =
          (entry.constraints[deal.dominantConstraint] ?? 0) + 1;
      }
      for (const lgaId of deal.lgaIds) {
        entry.lgaIds.add(lgaId);
      }
    }

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.dealCount - a.dealCount);
  }, [deals, sectorOpportunities]);

  /* Deals by sector for horizontal bar chart */
  const maxSectorDealCount = useMemo(
    () => Math.max(...sectorData.map((s) => s.dealCount), 1),
    [sectorData],
  );

  /* Investment by sector */
  const maxSectorInvestment = useMemo(
    () => Math.max(...sectorData.map((s) => s.investment), 1),
    [sectorData],
  );

  /* Top-level stats */
  const sectorsWithDeals = useMemo(
    () => sectorData.filter((s) => s.dealCount > 0).length,
    [sectorData],
  );
  const totalLgasCovered = useMemo(() => {
    const allLgas = new Set<string>();
    for (const s of sectorData) {
      for (const lgaId of s.lgaIds) allLgas.add(lgaId);
    }
    return allLgas.size;
  }, [sectorData]);

  /* Top constraints across all sectors */
  const topConstraints = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sectorData) {
      for (const [c, n] of Object.entries(s.constraints)) {
        counts[c] = (counts[c] ?? 0) + (n ?? 0);
      }
    }
    return Object.entries(counts)
      .map(([key, count]) => ({ key, label: CONSTRAINT_LABELS[key as keyof typeof CONSTRAINT_LABELS] ?? key, count }))
      .sort((a, b) => b.count - a.count);
  }, [sectorData]);
  const maxConstraintCount = useMemo(
    () => Math.max(...topConstraints.map((c) => c.count), 1),
    [topConstraints],
  );

  return (
    <div className="flex flex-col gap-6" data-testid="sectors-analysis">
      <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
        Cross-sector analysis of deal distribution, investment concentration,
        constraint patterns, and geographic coverage.
      </p>

      {/* Summary bar */}
      <PipelineSummaryBar
        sectorCount={sectorCount}
        dealCount={deals.length}
        investment={pipelineStats.investment}
        impact={pipelineStats.impact}
        jobs={pipelineStats.jobs}
      />

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="summary-stats">
        <StatCard value={sectorOpportunities.length} label="Total sectors" />
        <StatCard value={sectorsWithDeals} label="Sectors with deals" />
        <StatCard value={totalLgasCovered} label="LGAs covered" />
        <StatCard
          value={`${percentOf(sectorsWithDeals, sectorOpportunities.length)}%`}
          label="Sector activation rate"
          accent={
            sectorsWithDeals === sectorOpportunities.length
              ? "text-emerald-700"
              : undefined
          }
        />
      </div>

      {/* Main analytics grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Deals by sector */}
        <SectionCard title="Deals by sector">
          <div className="space-y-3" data-testid="sector-deal-distribution">
            {sectorData.map((s) => (
              <HorizontalBar
                key={s.id}
                label={s.name}
                count={s.dealCount}
                max={maxSectorDealCount}
                colourClass={SECTOR_BAR_COLOURS[s.id] ?? "bg-[#C8C4BF]"}
              />
            ))}
          </div>
        </SectionCard>

        {/* Investment by sector */}
        <SectionCard title="Investment by sector">
          <div className="space-y-3" data-testid="sector-investment-distribution">
            {sectorData
              .filter((s) => s.investment > 0)
              .sort((a, b) => b.investment - a.investment)
              .map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-sm text-[#2C2C2C] w-48 shrink-0 truncate">
                    {s.name}
                  </span>
                  <div className="flex-1 h-6 bg-[#F5F3F0] relative overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${SECTOR_BAR_COLOURS[s.id] ?? "bg-[#C8C4BF]"}`}
                      style={{
                        width: `${(s.investment / maxSectorInvestment) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-[#6B6B6B] w-16 text-right tabular-nums">
                    {formatAUD(s.investment)}
                  </span>
                </div>
              ))}
          </div>
        </SectionCard>

        {/* Dominant constraints */}
        <SectionCard title="Dominant constraints across sectors">
          <div className="space-y-3" data-testid="constraint-distribution">
            {topConstraints.map((entry) => (
              <HorizontalBar
                key={entry.key}
                label={entry.label}
                count={entry.count}
                max={maxConstraintCount}
                colourClass="bg-[#C8C4BF]"
              />
            ))}
            {topConstraints.length === 0 && (
              <p className="text-sm text-[#9A9A9A]">No constraints recorded.</p>
            )}
          </div>
        </SectionCard>

        {/* Geographic coverage */}
        <SectionCard title="LGA coverage by sector">
          <div className="space-y-3" data-testid="lga-coverage">
            {sectorData
              .filter((s) => s.lgaIds.size > 0)
              .sort((a, b) => b.lgaIds.size - a.lgaIds.size)
              .map((s) => (
                <HorizontalBar
                  key={s.id}
                  label={s.name}
                  count={s.lgaIds.size}
                  max={Math.max(...sectorData.map((x) => x.lgaIds.size), 1)}
                  colourClass={SECTOR_BAR_COLOURS[s.id] ?? "bg-[#C8C4BF]"}
                />
              ))}
          </div>
        </SectionCard>
      </div>

      {/* Per-sector stage breakdown — full width */}
      <SectionCard title="Stage breakdown by sector">
        <div className="space-y-5" data-testid="sector-stage-breakdown">
          {sectorData
            .filter((s) => s.dealCount > 0)
            .map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#2C2C2C]">{s.name}</p>
                  <span className="text-xs text-[#6B6B6B]">
                    {s.dealCount} {s.dealCount === 1 ? "deal" : "deals"} ·{" "}
                    {formatAUD(s.investment)}
                  </span>
                </div>
                <div className="flex gap-1 h-5">
                  {STAGE_ORDER.map((stage) => {
                    const n = s.stages[stage] ?? 0;
                    if (n === 0) return null;
                    const pct = (n / s.dealCount) * 100;
                    return (
                      <div
                        key={stage}
                        className={`${STAGE_BAR_COLOURS[stage]} relative group cursor-default`}
                        style={{ width: `${pct}%`, minWidth: "1.5rem" }}
                        title={`${STAGE_LABELS[stage]}: ${n}`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#2C2C2C] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {n}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {STAGE_ORDER.map((stage) => {
                    const n = s.stages[stage] ?? 0;
                    if (n === 0) return null;
                    return (
                      <span
                        key={stage}
                        className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[stage]}`}
                      >
                        {STAGE_LABELS[stage]}: {n}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </SectionCard>
    </div>
  );
}
