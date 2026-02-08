"use client";

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Deal, DealStage, LGA, OpportunityType } from "@/lib/types";
import { filterDealsByQuery } from "@/lib/deals-search";
import type { DealFilterParams } from "@/lib/deals-search";
import { dealLgaNames } from "@/lib/opportunities";
import { STAGE_LABELS, READINESS_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES, READINESS_COLOUR_CLASSES } from "@/lib/stage-colours";
import { getStageGateChecklist } from "@/lib/deal-pathway-utils";
import { MiniStat } from "@/components/ui/MiniStat";
import { COLOUR_CLASSES, OPP_TYPE_COLOUR, formatAUD } from "@/lib/colour-system";
import { PipelineSummaryBar } from "@/components/ui/PipelineSummaryBar";

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
  /** Number of sector opportunities — drives the "Sectors" metric in the summary bar */
  sectorCount: number;
  dealTotal: number;
  dealLimit: number;
  dealOffset: number;
}

export function DealsSearch({
  deals: baseDeals,
  opportunityTypes,
  lgas,
  sectorCount,
  dealTotal,
  dealLimit,
  dealOffset,
}: DealsSearchProps) {
  const [serverDeals, setServerDeals] = useState(baseDeals);
  const [allDeals, setAllDeals] = useState<Deal[] | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [serverPage, setServerPage] = useState(
    Math.floor(dealOffset / dealLimit) + 1,
  );

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

  const deals = allDeals ?? serverDeals;

  const clearFilters = useCallback(() => {
    setQuery("");
    setStageFilter("");
    setOtFilter("");
    setLgaFilter("");
    setPage(1);
    setServerPage(1);
  }, []);

  const filtered = useMemo(() => {
    if (!hasActiveFilters) return deals;
    return filterDealsByQuery(deals, query, opportunityTypes, lgas, filters);
  }, [deals, query, opportunityTypes, lgas, filters, hasActiveFilters]);

  // Resetting the client-side page is handled in filter handlers.

  useEffect(() => {
    if (!hasActiveFilters) return;
    if (allDeals) return;
    const controller = new AbortController();
    (async () => {
      try {
        const totalLimit = Math.max(dealTotal, 1);
        const res = await fetch(`/api/deals?limit=${totalLimit}&offset=0`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Deal[] };
        if (!controller.signal.aborted) setAllDeals(data.items);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    })();
    return () => controller.abort();
  }, [hasActiveFilters, allDeals, dealTotal]);

  useEffect(() => {
    if (hasActiveFilters) return;
    const controller = new AbortController();
    (async () => {
      try {
        const offset = (serverPage - 1) * dealLimit;
        const res = await fetch(`/api/deals?limit=${dealLimit}&offset=${offset}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Deal[] };
        if (!controller.signal.aborted) setServerDeals(data.items);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    })();
    return () => controller.abort();
  }, [hasActiveFilters, serverPage, dealLimit]);

  const pageSize = dealLimit;
  const totalPages = hasActiveFilters
    ? Math.max(1, Math.ceil(filtered.length / pageSize))
    : Math.max(1, Math.ceil(dealTotal / pageSize));
  const currentPage = hasActiveFilters
    ? Math.min(page, totalPages)
    : Math.min(serverPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(
    startIndex + pageSize,
    hasActiveFilters ? filtered.length : dealTotal,
  );
  const paged = hasActiveFilters ? filtered.slice(startIndex, endIndex) : filtered;

  /* Aggregate stats across ALL deals (unfiltered) for summary bar */
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

  const opportunityTypeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ot of opportunityTypes) {
      map.set(ot.id, ot.name);
    }
    return map;
  }, [opportunityTypes]);

  const getOpportunityTypeName = useCallback(
    (deal: Deal) =>
      opportunityTypeNameById.get(deal.opportunityTypeId) ?? deal.opportunityTypeId,
    [opportunityTypeNameById],
  );

  const selectClassName =
    "h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out";

  return (
    <div className="flex flex-col gap-6" data-testid="deals-search">
      {/* ------------------------------------------------------------------ */}
      {/* Summary stats bar                                                   */}
      {/* ------------------------------------------------------------------ */}
      <PipelineSummaryBar
        sectorCount={sectorCount}
        dealCount={deals.length}
        investment={pipelineStats.investment}
        impact={pipelineStats.impact}
        jobs={pipelineStats.jobs}
      />

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
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search deals…"
          aria-label="Filter deals by name, opportunity type, or LGA name"
          autoComplete="off"
          className="flex-1 w-full sm:w-auto h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="deals-search-input"
        />

        <select
          value={otFilter}
          onChange={(e) => {
            setOtFilter(e.target.value);
            setPage(1);
          }}
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
          onChange={(e) => {
            setStageFilter(e.target.value as DealStage | "");
            setPage(1);
          }}
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
          onChange={(e) => {
            setLgaFilter(e.target.value);
            setPage(1);
          }}
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

        <span
          className="text-xs text-[#6B6B6B]"
          data-testid="deals-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {hasActiveFilters ? filtered.length : dealTotal}{" "}
          {hasActiveFilters
            ? filtered.length === 1
              ? "deal"
              : "deals"
            : dealTotal === 1
              ? "deal"
              : "deals"}
          {(hasActiveFilters ? filtered.length : dealTotal) > 0 && (
            <> · Showing {startIndex + 1}-{endIndex}</>
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Clear filters"
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
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="deals-results-list"
          >
          {paged.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                opportunityTypeName={getOpportunityTypeName(deal)}
                lgaNames={dealLgaNames(deal, lgas).join(", ")}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
              <button
                type="button"
              onClick={() =>
                hasActiveFilters
                  ? setPage((p) => Math.max(1, p - 1))
                  : setServerPage((p) => Math.max(1, p - 1))
              }
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="px-2 py-1 border border-[#E8E6E3] bg-white disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
              onClick={() =>
                hasActiveFilters
                  ? setPage((p) => Math.min(totalPages, p + 1))
                  : setServerPage((p) => Math.min(totalPages, p + 1))
              }
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="px-2 py-1 border border-[#E8E6E3] bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

const DealCard = memo(function DealCard({
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
});

// MiniStat is imported from shared component — see components/ui/MiniStat.tsx
