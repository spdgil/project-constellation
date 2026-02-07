"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import type { Deal, DealStage, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { filterDealsByQuery } from "@/lib/deals-search";
import type { DealFilterParams } from "@/lib/deals-search";
import { dealLgaNames } from "@/lib/opportunities";
import { STAGE_LABELS, READINESS_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES, READINESS_COLOUR_CLASSES } from "@/lib/stage-colours";
import { getStageGateChecklist } from "@/lib/deal-pathway-utils";
import {
  type ColourFamily,
  COLOUR_CLASSES,
  OPP_TYPE_COLOUR,
  formatAUD,
} from "@/lib/colour-system";

const STAGE_OPTIONS: DealStage[] = [
  "definition",
  "pre-feasibility",
  "feasibility",
  "structuring",
  "transaction-close",
];

export interface DealsSearchProps {
  deals: Deal[];
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
}

export function DealsSearch({
  deals: baseDeals,
  opportunityTypes,
  lgas,
}: DealsSearchProps) {
  const deals = useDealsWithOverrides(baseDeals);
  const [query, setQuery] = useState("");

  /* Faceted filter state */
  const [stageFilter, setStageFilter] = useState<DealStage | "">("");
  const [otFilter, setOtFilter] = useState("");
  const [lgaFilter, setLgaFilter] = useState("");

  const filters: DealFilterParams = useMemo(() => {
    const f: DealFilterParams = {};
    if (stageFilter) f.stage = stageFilter;
    if (otFilter) f.opportunityTypeId = otFilter;
    if (lgaFilter) f.lgaId = lgaFilter;
    return f;
  }, [stageFilter, otFilter, lgaFilter]);

  const hasActiveFilters = !!(stageFilter || otFilter || lgaFilter || query.trim());

  const clearFilters = useCallback(() => {
    setQuery("");
    setStageFilter("");
    setOtFilter("");
    setLgaFilter("");
  }, []);

  const filtered = useMemo(
    () => filterDealsByQuery(deals, query, opportunityTypes, lgas, filters),
    [deals, query, opportunityTypes, lgas, filters],
  );

  /* Aggregate stats across ALL deals (unfiltered) for summary bar */
  const globalStats = useMemo(() => {
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

  const getOpportunityTypeName = (deal: Deal) =>
    opportunityTypes.find((o) => o.id === deal.opportunityTypeId)?.name ??
    deal.opportunityTypeId;

  const selectClassName =
    "h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out";

  return (
    <div className="flex flex-col gap-6" data-testid="deals-search">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
            Deals
          </h1>
          <p className="mt-1 text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
            Active deals across all sector opportunities, tracked through the
            investment pathway from definition to transaction close.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary stats bar                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="summary-bar">
        <SummaryCard
          label="Total deals"
          value={String(deals.length)}
          sub="across all sectors"
          colour="blue"
        />
        <SummaryCard
          label="Investment"
          value={globalStats.investment > 0 ? formatAUD(globalStats.investment) : "—"}
          sub="total deal value"
          colour="amber"
        />
        <SummaryCard
          label="Economic impact"
          value={globalStats.impact > 0 ? formatAUD(globalStats.impact) : "—"}
          sub="projected GDP contribution"
          colour="emerald"
        />
        <SummaryCard
          label="Jobs identified"
          value={globalStats.jobs > 0 ? globalStats.jobs.toLocaleString() : "—"}
          sub="across active deals"
          colour="emerald"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search + filter bar                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label htmlFor="deals-search-input" className="sr-only">
          Filter deals by name, opportunity type, or LGA name
        </label>
        <input
          id="deals-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deals…"
          aria-label="Filter deals by name, opportunity type, or LGA name"
          autoComplete="off"
          className="flex-1 w-full sm:w-auto h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="deals-search-input"
        />

        <select
          value={otFilter}
          onChange={(e) => setOtFilter(e.target.value)}
          aria-label="Filter by opportunity type"
          className={selectClassName}
          data-testid="filter-opportunity-type"
        >
          <option value="">All types</option>
          {opportunityTypes.map((ot) => (
            <option key={ot.id} value={ot.id}>
              {ot.name}
            </option>
          ))}
        </select>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as DealStage | "")}
          aria-label="Filter by stage"
          className={selectClassName}
          data-testid="filter-stage"
        >
          <option value="">All stages</option>
          {STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={lgaFilter}
          onChange={(e) => setLgaFilter(e.target.value)}
          aria-label="Filter by LGA"
          className={selectClassName}
          data-testid="filter-lga"
        >
          <option value="">All LGAs</option>
          {lgas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <span className="text-xs text-[#6B6B6B]" data-testid="deals-count">
          {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A]"
            data-testid="clear-filters"
          >
            Clear
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Deal cards grid                                                     */}
      {/* ------------------------------------------------------------------ */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#6B6B6B]">
          {hasActiveFilters
            ? "No deals match your filters."
            : "No deals available."}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          data-testid="deals-results-list"
        >
          {filtered.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              opportunityTypeName={getOpportunityTypeName(deal)}
              lgaNames={dealLgaNames(deal, lgas).join(", ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  sub,
  colour,
}: {
  label: string;
  value: string;
  sub: string;
  colour: ColourFamily;
}) {
  const c = COLOUR_CLASSES[colour];
  return (
    <div
      className={`bg-white border border-[#E8E6E3] border-l-[3px] ${c.borderLeft} px-4 py-3 space-y-0.5`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
        {label}
      </p>
      <p className={`text-xl font-heading font-normal ${c.text}`}>
        {value}
      </p>
      <p className="text-[11px] text-[#9A9A9A]">{sub}</p>
    </div>
  );
}

function DealCard({
  deal,
  opportunityTypeName,
  lgaNames,
}: {
  deal: Deal;
  opportunityTypeName: string;
  lgaNames: string;
}) {
  const colour = OPP_TYPE_COLOUR[deal.opportunityTypeId] ?? "blue";
  const c = COLOUR_CLASSES[colour];

  const gateEntries = getStageGateChecklist(deal.gateChecklist ?? {}, deal.stage);
  const gateSatisfied = gateEntries.filter((e) => e.status === "satisfied").length;
  const gateTotal = gateEntries.length;
  const allGates = gateSatisfied === gateTotal && gateTotal > 0;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className={`group flex flex-col bg-white border border-[#E8E6E3] border-t-[3px] ${c.borderTop} hover:border-[#7A6B5A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]`}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-3 space-y-2">
        <h2 className="text-[15px] font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
          {deal.name}
        </h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          {opportunityTypeName} · {lgaNames || "\u2014"}
        </p>
      </div>

      {/* Badges row */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        <span
          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[deal.stage]}`}
        >
          {STAGE_LABELS[deal.stage]}
        </span>
        <span
          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${READINESS_COLOUR_CLASSES[deal.readinessState]}`}
        >
          {READINESS_LABELS[deal.readinessState]}
        </span>
        {gateTotal > 0 && (
          <span
            className={`text-[10px] tracking-wider px-1.5 py-0.5 ${
              allGates
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
            }`}
          >
            {gateSatisfied}/{gateTotal} gates
          </span>
        )}
      </div>

      {/* Stats strip */}
      <div className="mx-5 border-t border-[#E8E6E3] pt-3 pb-4 mt-auto">
        <div className="grid grid-cols-2 gap-1">
          <MiniStat
            label="Investment"
            value={
              deal.investmentValueAmount > 0
                ? formatAUD(deal.investmentValueAmount)
                : "—"
            }
          />
          <MiniStat
            label="Jobs"
            value={
              (deal.economicImpactJobs ?? 0) > 0
                ? deal.economicImpactJobs!.toLocaleString()
                : "—"
            }
          />
        </div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-medium">
        {label}
      </p>
      <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">{value}</p>
    </div>
  );
}
