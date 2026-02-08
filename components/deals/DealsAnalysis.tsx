"use client";

import { useMemo } from "react";

import type { Deal, DealStage, ReadinessState, LGA, OpportunityType } from "@/lib/types";
import { STAGE_LABELS, READINESS_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES, READINESS_COLOUR_CLASSES } from "@/lib/stage-colours";
import { STAGE_ORDER, getStageGateChecklist } from "@/lib/deal-pathway-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CountEntry<K extends string> {
  key: K;
  label: string;
  count: number;
}

export interface DealsAnalysisProps {
  deals: Deal[];
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countBy<K extends string>(
  items: Deal[],
  accessor: (d: Deal) => K,
  labelMap: Record<string, string>,
  order?: K[],
): CountEntry<K>[] {
  const counts: Partial<Record<K, number>> = {};
  for (const d of items) {
    const k = accessor(d);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const keys = order ?? (Object.keys(counts) as K[]);
  return keys.map((k) => ({
    key: k,
    label: labelMap[k] ?? k,
    count: counts[k] ?? 0,
  }));
}

function percentOf(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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
      <span className="text-sm text-[#2C2C2C] w-40 shrink-0 truncate">{label}</span>
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

// ---------------------------------------------------------------------------
// Bar colour maps (using Tailwind background only for the bar fill)
// ---------------------------------------------------------------------------

const STAGE_BAR_COLOURS: Record<DealStage, string> = {
  definition: "bg-amber-200",
  "pre-feasibility": "bg-amber-300",
  feasibility: "bg-blue-300",
  structuring: "bg-violet-300",
  "transaction-close": "bg-emerald-300",
};

const READINESS_BAR_COLOURS: Record<ReadinessState, string> = {
  "no-viable-projects": "bg-[#D4D0CC]",
  "conceptual-interest": "bg-amber-200",
  "feasibility-underway": "bg-amber-300",
  "structurable-but-stalled": "bg-blue-300",
  "investable-with-minor-intervention": "bg-emerald-300",
  "scaled-and-replicable": "bg-emerald-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealsAnalysis({ deals, opportunityTypes, lgas }: DealsAnalysisProps) {

  // --- Summary stats ---
  const totalDeals = deals.length;

  const stageDistribution = useMemo(
    () => countBy(deals, (d) => d.stage, STAGE_LABELS, [...STAGE_ORDER]),
    [deals],
  );

  const maxStageCount = useMemo(
    () => Math.max(...stageDistribution.map((s) => s.count), 1),
    [stageDistribution],
  );

  const readinessOrder = useMemo<ReadinessState[]>(
    () => [
      "no-viable-projects",
      "conceptual-interest",
      "feasibility-underway",
      "structurable-but-stalled",
      "investable-with-minor-intervention",
      "scaled-and-replicable",
    ],
    [],
  );
  const readinessDistribution = useMemo(
    () => countBy(deals, (d) => d.readinessState, READINESS_LABELS, readinessOrder),
    [deals, readinessOrder],
  );
  const maxReadinessCount = useMemo(
    () => Math.max(...readinessDistribution.map((s) => s.count), 1),
    [readinessDistribution],
  );

  // --- Constraint analysis ---
  const constraintDistribution = useMemo(() => {
    const entries = countBy(deals, (d) => d.dominantConstraint, CONSTRAINT_LABELS);
    return entries.filter((e) => e.count > 0).sort((a, b) => b.count - a.count);
  }, [deals]);
  const maxConstraintCount = useMemo(
    () => Math.max(...constraintDistribution.map((s) => s.count), 1),
    [constraintDistribution],
  );

  // --- Gate progress ---
  const gateStats = useMemo(() => {
    let totalGates = 0;
    let satisfiedGates = 0;
    for (const deal of deals) {
      const entries = getStageGateChecklist(deal.gateChecklist ?? {}, deal.stage);
      totalGates += entries.length;
      satisfiedGates += entries.filter((e) => e.status === "satisfied").length;
    }
    return { totalGates, satisfiedGates };
  }, [deals]);

  // --- By opportunity type ---
  const byOpportunityType = useMemo(() => {
    const map = new Map<string, { name: string; count: number; stages: Partial<Record<DealStage, number>> }>();
    for (const deal of deals) {
      const ot = opportunityTypes.find((o) => o.id === deal.opportunityTypeId);
      const name = ot?.name ?? deal.opportunityTypeId;
      if (!map.has(deal.opportunityTypeId)) {
        map.set(deal.opportunityTypeId, { name, count: 0, stages: {} });
      }
      const entry = map.get(deal.opportunityTypeId)!;
      entry.count++;
      entry.stages[deal.stage] = (entry.stages[deal.stage] ?? 0) + 1;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [deals, opportunityTypes]);

  // --- By LGA ---
  const byLga = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const deal of deals) {
      for (const lgaId of deal.lgaIds) {
        if (!map.has(lgaId)) {
          const lga = lgas.find((l) => l.id === lgaId);
          map.set(lgaId, { name: lga?.name ?? lgaId, count: 0 });
        }
        map.get(lgaId)!.count++;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [deals, lgas]);
  const maxLgaCount = useMemo(
    () => Math.max(...byLga.map((l) => l.count), 1),
    [byLga],
  );

  // --- Furthest stage (most advanced deal) ---
  const furthestStage = useMemo(() => {
    let maxIdx = 0;
    for (const d of deals) {
      const idx = STAGE_ORDER.indexOf(d.stage);
      if (idx > maxIdx) maxIdx = idx;
    }
    return STAGE_LABELS[STAGE_ORDER[maxIdx]];
  }, [deals]);

  return (
    <div className="flex flex-col gap-6" data-testid="deals-analysis">
      <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
        Pipeline-wide analysis of deal stages, gate progress, and readiness
        distribution.
      </p>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="summary-stats">
        <StatCard value={totalDeals} label="Total deals" />
        <StatCard value={furthestStage} label="Most advanced stage" />
        <StatCard
          value={`${gateStats.satisfiedGates}/${gateStats.totalGates}`}
          label="Gates satisfied"
          accent={
            gateStats.satisfiedGates === gateStats.totalGates && gateStats.totalGates > 0
              ? "text-emerald-700"
              : undefined
          }
        />
        <StatCard
          value={`${percentOf(gateStats.satisfiedGates, gateStats.totalGates)}%`}
          label="Gate completion rate"
        />
      </div>

      {/* Main analytics grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Stage pipeline */}
        <SectionCard title="Pipeline by stage">
          <div className="space-y-3" data-testid="stage-pipeline">
            {stageDistribution.map((entry) => (
              <div key={entry.key}>
                <HorizontalBar
                  label={entry.label}
                  count={entry.count}
                  max={maxStageCount}
                  colourClass={STAGE_BAR_COLOURS[entry.key]}
                />
                <div className="flex items-center gap-1 mt-1 ml-40 pl-3">
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[entry.key]}`}
                  >
                    {entry.label}
                  </span>
                  <span className="text-[10px] text-[#9A9A9A]">
                    {percentOf(entry.count, totalDeals)}% of portfolio
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Readiness distribution */}
        <SectionCard title="Readiness distribution">
          <div className="space-y-3" data-testid="readiness-distribution">
            {readinessDistribution
              .filter((e) => e.count > 0)
              .map((entry) => (
                <div key={entry.key}>
                  <HorizontalBar
                    label={entry.label}
                    count={entry.count}
                    max={maxReadinessCount}
                    colourClass={READINESS_BAR_COLOURS[entry.key]}
                  />
                  <div className="flex items-center gap-1 mt-1 ml-40 pl-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${READINESS_COLOUR_CLASSES[entry.key]}`}
                    >
                      {entry.label}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>

        {/* Top constraints */}
        <SectionCard title="Dominant constraints">
          <div className="space-y-3" data-testid="constraint-distribution">
            {constraintDistribution.map((entry) => (
              <HorizontalBar
                key={entry.key}
                label={entry.label}
                count={entry.count}
                max={maxConstraintCount}
                colourClass="bg-[#C8C4BF]"
              />
            ))}
          </div>
        </SectionCard>

        {/* By LGA */}
        <SectionCard title="Deals by LGA">
          <div className="space-y-3" data-testid="lga-distribution">
            {byLga.map((entry) => (
              <HorizontalBar
                key={entry.name}
                label={entry.name}
                count={entry.count}
                max={maxLgaCount}
                colourClass="bg-[#C8C4BF]"
              />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* By Opportunity Type — full width breakdown */}
      <SectionCard title="Breakdown by opportunity type">
        <div className="space-y-5" data-testid="ot-breakdown">
          {byOpportunityType.map((ot) => (
            <div key={ot.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#2C2C2C]">{ot.name}</p>
                <span className="text-xs text-[#6B6B6B]">
                  {ot.count} {ot.count === 1 ? "deal" : "deals"}
                </span>
              </div>
              <div className="flex gap-1 h-5">
                {STAGE_ORDER.map((stage) => {
                  const n = ot.stages[stage] ?? 0;
                  if (n === 0) return null;
                  const pct = (n / ot.count) * 100;
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
              {/* Legend row */}
              <div className="flex flex-wrap gap-2 mt-1.5">
                {STAGE_ORDER.map((stage) => {
                  const n = ot.stages[stage] ?? 0;
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
