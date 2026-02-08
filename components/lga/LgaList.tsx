"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { formatAUD } from "@/lib/colour-system";
import { PipelineSummaryBar } from "@/components/ui/PipelineSummaryBar";
import { MiniStat } from "@/components/ui/MiniStat";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface LgaListProps {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
  sectorCount: number;
}

interface LgaStats {
  dealCount: number;
  investment: number;
  impact: number;
  jobs: number;
  sectors: Set<string>;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function LgaList({
  lgas,
  deals: baseDeals,
  opportunityTypes,
  sectorCount,
}: LgaListProps) {
  const deals = useDealsWithOverrides(baseDeals);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 24;

  /* Per-LGA statistics computed from all deals */
  const lgaStatsMap = useMemo(() => {
    const map: Record<string, LgaStats> = {};
    for (const lga of lgas) {
      map[lga.id] = {
        dealCount: 0,
        investment: 0,
        impact: 0,
        jobs: 0,
        sectors: new Set<string>(),
      };
    }
    for (const deal of deals) {
      for (const lgaId of deal.lgaIds) {
        const s = map[lgaId];
        if (!s) continue;
        s.dealCount += 1;
        s.investment += deal.investmentValueAmount ?? 0;
        s.impact += deal.economicImpactAmount ?? 0;
        s.jobs += deal.economicImpactJobs ?? 0;
        s.sectors.add(deal.opportunityTypeId);
      }
    }
    return map;
  }, [lgas, deals]);

  /* Pipeline-wide stats for the summary bar */
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

  /* Filter */
  const filtered = useMemo(() => {
    if (!query.trim()) return lgas;
    const q = query.toLowerCase().trim();
    return lgas.filter((lga) => {
      if (lga.name.toLowerCase().includes(q)) return true;
      if (lga.summary?.toLowerCase().includes(q)) return true;
      if (
        lga.opportunityHypotheses?.some((h) =>
          h.name.toLowerCase().includes(q),
        )
      )
        return true;
      return false;
    });
  }, [lgas, query]);

  const hasActiveFilters = !!query.trim();
  const clearFilters = useCallback(() => setQuery(""), []);

  /* Sort: LGAs with deals first, then alphabetical */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDealCount = lgaStatsMap[a.id]?.dealCount ?? 0;
      const bDealCount = lgaStatsMap[b.id]?.dealCount ?? 0;
      if (bDealCount !== aDealCount) return bDealCount - aDealCount;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, lgaStatsMap]);

  // Reset page when query changes (adjust-state-during-render pattern)
  const prevQueryRef = useRef(query);
  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sorted.length);
  const paged = sorted.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-6" data-testid="lga-list">
      {/* Summary bar */}
      <PipelineSummaryBar
        sectorCount={sectorCount}
        dealCount={deals.length}
        investment={pipelineStats.investment}
        impact={pipelineStats.impact}
        jobs={pipelineStats.jobs}
      />

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label htmlFor="lga-search-input" className="sr-only">
          Filter LGAs by name or opportunity
        </label>
        <input
          id="lga-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search LGAs…"
          aria-label="Filter LGAs by name or opportunity"
          autoComplete="off"
          className="flex-1 w-full sm:w-auto h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="lga-search-input"
        />

        <span className="text-xs text-[#6B6B6B]" data-testid="lga-count">
          {sorted.length} {sorted.length === 1 ? "LGA" : "LGAs"}
          {sorted.length > 0 && (
            <> · Showing {startIndex + 1}-{endIndex}</>
          )}
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

      {/* LGA cards grid */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#6B6B6B]">
          {hasActiveFilters
            ? "No LGAs match your search."
            : "No LGAs available."}
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="lga-results-list"
          >
            {paged.map((lga) => (
              <LgaCard
                key={lga.id}
                lga={lga}
                stats={lgaStatsMap[lga.id]}
                opportunityTypes={opportunityTypes}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-[#E8E6E3] bg-white disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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

function LgaCard({
  lga,
  stats,
  opportunityTypes,
}: {
  lga: LGA;
  stats?: LgaStats;
  opportunityTypes: OpportunityType[];
}) {
  const dealCount = stats?.dealCount ?? 0;
  const investment = stats?.investment ?? 0;
  const impact = stats?.impact ?? 0;
  const jobs = stats?.jobs ?? 0;
  const hypothesisCount = lga.opportunityHypotheses?.length ?? 0;

  /* Map sector IDs to names */
  const sectorNames = useMemo(() => {
    if (!stats?.sectors.size) return [];
    return Array.from(stats.sectors)
      .map((id) => opportunityTypes.find((ot) => ot.id === id)?.name ?? id)
      .sort();
  }, [stats, opportunityTypes]);

  return (
    <Link
      href={`/lga/${lga.id}`}
      className="group flex flex-col bg-white border border-[#E8E6E3] border-t-[3px] border-t-[#7A6B5A] hover:border-[#7A6B5A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-3 space-y-2">
        <h2 className="text-[15px] font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
          {lga.name}
        </h2>
        {lga.summary && (
          <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">
            {lga.summary}
          </p>
        )}
      </div>

      {/* Hypotheses & sectors */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        {hypothesisCount > 0 && (
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200">
            {hypothesisCount} {hypothesisCount === 1 ? "hypothesis" : "hypotheses"}
          </span>
        )}
        {sectorNames.slice(0, 3).map((name) => (
          <span
            key={name}
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
          >
            {name}
          </span>
        ))}
        {sectorNames.length > 3 && (
          <span className="text-[10px] text-[#9A9A9A]">
            +{sectorNames.length - 3}
          </span>
        )}
      </div>

      {/* Stats strip */}
      <div className="mx-5 border-t border-[#E8E6E3] pt-3 pb-4 mt-auto">
        <div className="grid grid-cols-4 gap-1">
          <MiniStat label="Deals" value={dealCount > 0 ? String(dealCount) : "—"} />
          <MiniStat
            label="Investment"
            value={investment > 0 ? formatAUD(investment) : "—"}
          />
          <MiniStat
            label="Impact"
            value={impact > 0 ? formatAUD(impact) : "—"}
          />
          <MiniStat
            label="Jobs"
            value={jobs > 0 ? jobs.toLocaleString() : "—"}
          />
        </div>
      </div>
    </Link>
  );
}

// MiniStat is imported from shared component — see components/ui/MiniStat.tsx
