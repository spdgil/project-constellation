"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import type { SectorOpportunity } from "@/lib/types";
import {
  type ColourFamily,
  COLOUR_CLASSES,
  SECTOR_COLOUR,
  TAG_COLOUR,
  formatAUD,
  humaniseTag,
} from "@/lib/colour-system";
import { PipelineSummaryBar } from "@/components/ui/PipelineSummaryBar";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface SectorStats {
  dealCount: number;
  totalInvestment: number;
  totalEconomicImpact: number;
  totalJobs: number;
  strategyCount: number;
}

export interface SectorOpportunitiesIndexProps {
  sectorOpportunities: SectorOpportunity[];
  sectorStats: Record<string, SectorStats>;
  totalDeals: number;
  totalStrategies: number;
}

/** Extract a ~140-char snippet from the first paragraph of section 1. */
function sectorSnippet(so: SectorOpportunity): string {
  const text = so.sections["1"] ?? "";
  const firstPara = text.split("\n\n")[0] ?? text;
  if (firstPara.length <= 140) return firstPara;
  return firstPara.slice(0, 137).replace(/\s+\S*$/, "") + "…";
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function SectorOpportunitiesIndex({
  sectorOpportunities,
  sectorStats,
  totalDeals,
  totalStrategies,
}: SectorOpportunitiesIndexProps) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const so of sectorOpportunities) {
      for (const t of so.tags) set.add(t);
    }
    return Array.from(set).sort();
  }, [sectorOpportunities]);

  // Filter
  const filtered = useMemo(() => {
    let list = sectorOpportunities;
    if (tagFilter) {
      list = list.filter((so) => so.tags.includes(tagFilter));
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((so) => {
        if (so.name.toLowerCase().includes(q)) return true;
        if (so.tags.some((t) => t.toLowerCase().includes(q))) return true;
        if (so.sections["1"]?.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return list;
  }, [sectorOpportunities, query, tagFilter]);

  const hasActiveFilters = !!(query.trim() || tagFilter);

  const clearFilters = useCallback(() => {
    setQuery("");
    setTagFilter("");
  }, []);

  // Aggregate stats across all (unfiltered) sectors for the summary bar
  const globalStats = useMemo(() => {
    let deals = 0;
    let investment = 0;
    let impact = 0;
    let jobs = 0;
    for (const s of Object.values(sectorStats)) {
      deals += s.dealCount;
      investment += s.totalInvestment;
      impact += s.totalEconomicImpact;
      jobs += s.totalJobs;
    }
    return { deals, investment, impact, jobs };
  }, [sectorStats]);

  return (
    <div className="flex flex-col gap-6" data-testid="sectors-index">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
            Sector Opportunities
          </h1>
          <p className="mt-1 text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
            Seven priority sectors identified for METS diversification, based on
            adjacency to existing skills, government priority, and growth
            trajectory.
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
      {/* Summary metrics bar                                                 */}
      {/* ------------------------------------------------------------------ */}
      <PipelineSummaryBar
        sectorCount={sectorOpportunities.length}
        dealCount={totalDeals}
        investment={globalStats.investment}
        impact={globalStats.impact}
        jobs={globalStats.jobs}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Search + filter bar                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label htmlFor="sectors-search-input" className="sr-only">
          Filter sector opportunities
        </label>
        <input
          id="sectors-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sectors…"
          aria-label="Filter sector opportunities by name or tag"
          autoComplete="off"
          className="flex-1 w-full sm:w-auto h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="sectors-search-input"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          aria-label="Filter by tag"
          className="h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="filter-tag"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {humaniseTag(t)}
            </option>
          ))}
        </select>

        <span className="text-xs text-[#6B6B6B]" data-testid="sectors-count">
          {filtered.length}{" "}
          {filtered.length === 1 ? "sector" : "sectors"}
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
      {/* Sector cards grid                                                   */}
      {/* ------------------------------------------------------------------ */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#6B6B6B]">
          {hasActiveFilters
            ? "No sector opportunities match your filters."
            : "No sector opportunities available."}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          data-testid="sectors-results-list"
        >
          {filtered.map((so) => {
            const stats = sectorStats[so.id];
            return (
              <SectorCard key={so.id} sectorOpportunity={so} stats={stats} />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function SectorCard({
  sectorOpportunity: so,
  stats,
}: {
  sectorOpportunity: SectorOpportunity;
  stats?: SectorStats;
}) {
  const snippet = sectorSnippet(so);
  const dealCount = stats?.dealCount ?? 0;
  const investment = stats?.totalInvestment ?? 0;
  const impact = stats?.totalEconomicImpact ?? 0;
  const jobs = stats?.totalJobs ?? 0;

  const colour = SECTOR_COLOUR[so.id] ?? "blue";
  const c = COLOUR_CLASSES[colour];

  return (
    <Link
      href={`/sectors/${so.id}`}
      className={`group flex flex-col bg-white border border-[#E8E6E3] border-t-[3px] ${c.borderTop} hover:border-[#7A6B5A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]`}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-3 space-y-2">
        <h2 className="text-[15px] font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
          {so.name}
        </h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-3">
          {snippet}
        </p>
      </div>

      {/* Stats strip — always visible */}
      <div className="mx-5 border-t border-[#E8E6E3] pt-3 pb-1">
        <div className="grid grid-cols-4 gap-1">
          <MiniStat
            label="Deals"
            value={dealCount > 0 ? String(dealCount) : "—"}
            colour={dealCount > 0 ? colour : undefined}
          />
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

      {/* Tags */}
      <div className="px-5 pb-4 pt-2 mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {so.tags.slice(0, 4).map((tag) => {
            const tagColour = TAG_COLOUR[tag];
            const tc = tagColour ? COLOUR_CLASSES[tagColour] : null;
            return (
              <span
                key={tag}
                className={
                  tc
                    ? `text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${tc.tagBg} ${tc.tagText} border ${tc.tagBorder}`
                    : "text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                }
              >
                {humaniseTag(tag)}
              </span>
            );
          })}
          {so.tags.length > 4 && (
            <span className="text-[9px] text-[#9A9A9A]">
              +{so.tags.length - 4}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  colour,
}: {
  label: string;
  value: string;
  colour?: ColourFamily;
}) {
  const c = colour ? COLOUR_CLASSES[colour] : null;
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-medium">
        {label}
      </p>
      {c ? (
        <span
          className={`inline-block mt-0.5 text-sm font-medium px-1.5 py-0.5 ${c.tagBg} ${c.tagText} border ${c.tagBorder}`}
        >
          {value}
        </span>
      ) : (
        <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">{value}</p>
      )}
    </div>
  );
}
