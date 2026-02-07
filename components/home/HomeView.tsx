"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Deal, LGA, OpportunityType, ReadinessState, Constraint } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { READINESS_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import { formatAUD } from "@/lib/colour-system";

/* ====================================================================== */
/* Readiness colour palette — follows DESIGN_SYSTEM.md §Colour Families   */
/* Neutral → Amber → Blue → Emerald for clear visual differentiation      */
/* ====================================================================== */

const READINESS_COLOURS: Record<ReadinessState, string> = {
  "no-viable-projects":                 "#A3A3A3", // neutral grey
  "conceptual-interest":                "#D97706", // amber-600
  "feasibility-underway":               "#F59E0B", // amber-500
  "structurable-but-stalled":           "#3B82F6", // blue-500
  "investable-with-minor-intervention": "#10B981", // emerald-500
  "scaled-and-replicable":              "#059669", // emerald-600
};

const READINESS_ORDER: ReadinessState[] = [
  "no-viable-projects",
  "conceptual-interest",
  "feasibility-underway",
  "structurable-but-stalled",
  "investable-with-minor-intervention",
  "scaled-and-replicable",
];

/* ====================================================================== */
/* Props                                                                  */
/* ====================================================================== */

export interface HomeViewProps {
  opportunityTypes: OpportunityType[];
  deals: Deal[];
  lgas: LGA[];
}

/* ====================================================================== */
/* Root component                                                         */
/* ====================================================================== */

export function HomeView({
  opportunityTypes,
  deals: baseDeals,
  lgas,
}: HomeViewProps) {
  const deals = useDealsWithOverrides(baseDeals);

  return (
    <div data-testid="home-view">
      <OverviewTab deals={deals} lgas={lgas} opportunityTypes={opportunityTypes} />
    </div>
  );
}

/* ====================================================================== */
/* Overview tab                                                           */
/* ====================================================================== */

function OverviewTab({
  deals,
  lgas,
  opportunityTypes,
}: {
  deals: Deal[];
  lgas: LGA[];
  opportunityTypes: OpportunityType[];
}) {
  /* ---- computed metrics ---- */
  const totalInvestment = useMemo(
    () => deals.reduce((s, d) => s + (d.investmentValueAmount ?? 0), 0),
    [deals],
  );
  const totalImpact = useMemo(
    () => deals.reduce((s, d) => s + (d.economicImpactAmount ?? 0), 0),
    [deals],
  );
  const totalJobs = useMemo(
    () => deals.reduce((s, d) => s + (d.economicImpactJobs ?? 0), 0),
    [deals],
  );
  const activeLgaCount = useMemo(() => {
    const ids = new Set<string>();
    for (const d of deals) for (const id of d.lgaIds) ids.add(id);
    return ids.size;
  }, [deals]);

  /* ---- readiness distribution (global) ---- */
  const readinessDist = useMemo(() => buildReadinessDist(deals), [deals]);

  /* ---- OT summaries ---- */
  const otSummaries = useMemo(() => {
    return opportunityTypes.map((ot) => {
      const otDeals = deals.filter((d) => d.opportunityTypeId === ot.id);
      const inv = otDeals.reduce((s, d) => s + (d.investmentValueAmount ?? 0), 0);
      const dist = buildReadinessDist(otDeals);
      const constraintMap = new Map<Constraint, number>();
      for (const d of otDeals)
        constraintMap.set(d.dominantConstraint, (constraintMap.get(d.dominantConstraint) ?? 0) + 1);
      const topConstraint = [...constraintMap.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
      return { ot, deals: otDeals, investment: inv, readinessDist: dist, topConstraint };
    });
  }, [deals, opportunityTypes]);

  /* ---- GW LGAs (those with rich data) ---- */
  const focusLgas = useMemo(() => lgas.filter((l) => l.summary), [lgas]);

  return (
    <div data-testid="overview-tab" className="space-y-12">
      {/* ── Key metrics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-[#E8E6E3] border border-[#E8E6E3]">
        <MetricCard value={String(deals.length)} label="Deals" />
        <MetricCard value={formatAUD(totalInvestment)} label="Investment" />
        <MetricCard value={formatAUD(totalImpact)} label="Economic impact" />
        <MetricCard
          value={totalJobs > 0 ? totalJobs.toLocaleString() : "—"}
          label="Jobs"
        />
        <MetricCard
          value={String(activeLgaCount)}
          label={`Active LGA${activeLgaCount !== 1 ? "s" : ""}`}
        />
      </div>

      {/* ── Pipeline readiness ─────────────────────────────── */}
      <section data-testid="pipeline-section">
        <SectionHeading>Pipeline readiness</SectionHeading>
        <ReadinessBar distribution={readinessDist} total={deals.length} />
        <ReadinessLegend distribution={readinessDist} />
      </section>

      {/* ── Opportunity types ──────────────────────────────── */}
      <section data-testid="ot-section">
        <SectionHeading>By opportunity type</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otSummaries.map(({ ot, deals: otDeals, investment, readinessDist: dist, topConstraint }) => (
            <div
              key={ot.id}
              className="bg-white border border-[#E8E6E3] p-5"
            >
              <p className="text-sm font-medium text-[#2C2C2C] mb-3">
                {ot.name}
              </p>

              {/* Mini readiness bar */}
              {otDeals.length > 0 ? (
                <ReadinessBar distribution={dist} total={otDeals.length} height="h-1.5" />
              ) : (
                <div className="h-1.5 bg-[#F0EEEB] rounded-full" />
              )}

              {/* Stats row */}
              <div className="mt-3 flex items-baseline gap-3 text-xs text-[#6B6B6B]">
                <span className="tabular-nums">
                  {otDeals.length} deal{otDeals.length !== 1 ? "s" : ""}
                </span>
                {investment > 0 && (
                  <>
                    <Dot />
                    <span className="tabular-nums">{formatAUD(investment)}</span>
                  </>
                )}
              </div>

              {/* Top constraint chip */}
              {topConstraint && (
                <span className="mt-3 inline-block text-[10px] uppercase tracking-wider
                                 text-[#8A7560] bg-[#FAF9F7] border border-[#E8E6E3]
                                 px-2 py-0.5 rounded-full">
                  {CONSTRAINT_LABELS[topConstraint[0]]}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Greater Whitsunday LGAs ────────────────────────── */}
      {focusLgas.length > 0 && (
        <section data-testid="lga-section">
          <SectionHeading>Greater Whitsunday</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            {focusLgas.map((lga) => {
              const lgaDeals = deals.filter((d) => d.lgaIds.includes(lga.id));
              const lgaInv = lgaDeals.reduce((s, d) => s + (d.investmentValueAmount ?? 0), 0);
              const hypotheses = lga.opportunityHypotheses?.length ?? 0;
              const constraintMap = new Map<Constraint, number>();
              for (const d of lgaDeals)
                constraintMap.set(d.dominantConstraint, (constraintMap.get(d.dominantConstraint) ?? 0) + 1);
              const topC = [...constraintMap.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

              return (
                <div
                  key={lga.id}
                  className="bg-white border border-[#E8E6E3] p-5
                             hover:border-[#C8C4BF] transition-colors duration-200"
                >
                  <h3 className="font-heading text-base font-normal text-[#2C2C2C] mb-1">
                    {lga.name}
                  </h3>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed mb-4 line-clamp-2">
                    {lga.summary?.split(". ").slice(0, 2).join(". ")}.
                  </p>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-[#6B6B6B] mb-2">
                    <span className="tabular-nums">
                      {lgaDeals.length} deal{lgaDeals.length !== 1 ? "s" : ""}
                    </span>
                    {lgaInv > 0 && (
                      <>
                        <Dot />
                        <span className="tabular-nums">{formatAUD(lgaInv)}</span>
                      </>
                    )}
                    <Dot />
                    <span>
                      {hypotheses} hypothes{hypotheses !== 1 ? "es" : "is"}
                    </span>
                  </div>

                  {topC && (
                    <span className="inline-block text-[10px] uppercase tracking-wider
                                     text-[#8A7560] bg-[#FAF9F7] border border-[#E8E6E3]
                                     px-2 py-0.5 rounded-full">
                      {CONSTRAINT_LABELS[topC[0]]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick actions ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <ActionLink href="/deals">View all deals</ActionLink>
        <ActionLink href="/deals/memo">New deal from document</ActionLink>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Readiness bar — proportional stacked bar                               */
/* ====================================================================== */

interface ReadinessDistEntry {
  state: ReadinessState;
  count: number;
}

function ReadinessBar({
  distribution,
  total,
  height = "h-2.5",
}: {
  distribution: ReadinessDistEntry[];
  total: number;
  height?: string;
}) {
  if (total === 0) return <div className={`${height} bg-[#F0EEEB] rounded-full`} />;

  return (
    <div
      className={`${height} rounded-full overflow-hidden flex`}
      role="img"
      aria-label="Readiness distribution"
    >
      {distribution.map(({ state, count }) => {
        const pct = (count / total) * 100;
        if (pct === 0) return null;
        return (
          <div
            key={state}
            className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
            style={{ width: `${pct}%`, backgroundColor: READINESS_COLOURS[state] }}
            title={`${READINESS_LABELS[state]}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function ReadinessLegend({ distribution }: { distribution: ReadinessDistEntry[] }) {
  const active = distribution.filter((d) => d.count > 0);
  if (active.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
      {active.map(({ state, count }) => (
        <span key={state} className="flex items-center gap-2 text-xs text-[#6B6B6B]">
          <span
            className="inline-block w-3 h-3 shrink-0"
            style={{ backgroundColor: READINESS_COLOURS[state] }}
          />
          <span>{READINESS_LABELS[state]}</span>
          <span className="tabular-nums font-medium text-[#2C2C2C]">{count}</span>
        </span>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* Shared UI primitives                                                   */
/* ====================================================================== */

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <p className="font-heading text-xl sm:text-2xl font-normal text-[#2C2C2C] mb-1">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">{label}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-4">
      {children}
    </h2>
  );
}

function Dot() {
  return <span className="text-[#D4CFC9]" aria-hidden="true">·</span>;
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm px-4 py-2 border border-[#E8E6E3] text-[#2C2C2C]
                 hover:border-[#C8C4BF] hover:bg-[#FAF9F7]
                 transition-colors duration-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A]"
    >
      {children} <span aria-hidden="true">&rarr;</span>
    </Link>
  );
}

/* ====================================================================== */
/* Helpers                                                                */
/* ====================================================================== */

function buildReadinessDist(deals: Deal[]): ReadinessDistEntry[] {
  const map = new Map<ReadinessState, number>();
  for (const d of deals) map.set(d.readinessState, (map.get(d.readinessState) ?? 0) + 1);
  return READINESS_ORDER.map((state) => ({ state, count: map.get(state) ?? 0 }));
}

