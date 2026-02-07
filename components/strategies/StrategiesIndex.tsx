"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import type {
  SectorDevelopmentStrategy,
  StrategyGrade,
  SectorOpportunity,
  GradeLetter,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Grade colour classes                                                        */
/* -------------------------------------------------------------------------- */

const GRADE_COLOUR_CLASSES: Record<GradeLetter, string> = {
  A: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "A-": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  B: "bg-blue-50 text-blue-700 border border-blue-200",
  "B-": "bg-blue-50 text-blue-700 border border-blue-200",
  C: "bg-amber-50 text-amber-700 border border-amber-200",
  D: "bg-orange-50 text-orange-700 border border-orange-200",
  F: "bg-red-50 text-red-700 border border-red-200",
};

/* -------------------------------------------------------------------------- */
/* Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface StrategiesIndexProps {
  strategies: SectorDevelopmentStrategy[];
  strategyGrades: StrategyGrade[];
  sectorOpportunities: SectorOpportunity[];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function StrategiesIndex({
  strategies,
  strategyGrades,
  sectorOpportunities,
}: StrategiesIndexProps) {
  const [query, setQuery] = useState("");

  /* Grade lookup */
  const gradeByStrategyId = useMemo(() => {
    const map = new Map<string, StrategyGrade>();
    for (const g of strategyGrades) {
      map.set(g.strategyId, g);
    }
    return map;
  }, [strategyGrades]);

  /* Sector name lookup */
  const soNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const so of sectorOpportunities) {
      map.set(so.id, so.name);
    }
    return map;
  }, [sectorOpportunities]);

  /* Filter */
  const filtered = useMemo(() => {
    if (!query.trim()) return strategies;
    const q = query.toLowerCase().trim();
    return strategies.filter((s) => {
      if (s.title.toLowerCase().includes(q)) return true;
      if (s.summary.toLowerCase().includes(q)) return true;
      if (s.type.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [strategies, query]);

  const hasActiveFilters = !!query.trim();
  const clearFilters = useCallback(() => setQuery(""), []);

  return (
    <div className="flex flex-col gap-6" data-testid="strategies-index">
      {/* Action bar */}
      <div className="flex items-center justify-end">
        <Link
          href="/lga/strategies/upload"
          className="text-sm px-3 py-1.5 bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out"
        >
          Upload strategy
        </Link>
      </div>

      {/* Search + count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label htmlFor="strategies-search-input" className="sr-only">
          Filter strategies by title or summary
        </label>
        <input
          id="strategies-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search strategies…"
          aria-label="Filter strategies by title or summary"
          autoComplete="off"
          className="flex-1 w-full sm:w-auto h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="strategies-search-input"
        />

        <span className="text-xs text-[#6B6B6B]" data-testid="strategies-count">
          {filtered.length}{" "}
          {filtered.length === 1 ? "strategy" : "strategies"}
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

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#6B6B6B]">
          {hasActiveFilters
            ? "No strategies match your search."
            : "No strategies available."}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          data-testid="strategies-results-list"
        >
          {filtered.map((s) => {
            const grade = gradeByStrategyId.get(s.id);
            const sectorNames = s.prioritySectorIds
              .map((sid) => soNameById.get(sid))
              .filter(Boolean) as string[];
            const preview =
              s.summary.length > 140
                ? s.summary.slice(0, 137).replace(/\s+\S*$/, "") + "…"
                : s.summary;

            const href =
              s.status === "draft"
                ? `/lga/strategies/${s.id}/draft`
                : `/lga/strategies/${s.id}`;

            return (
              <StrategyCard
                key={s.id}
                href={href}
                title={s.title}
                preview={preview}
                isDraft={s.status === "draft"}
                grade={grade}
                sectorNames={sectorNames}
              />
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

function StrategyCard({
  href,
  title,
  preview,
  isDraft,
  grade,
  sectorNames,
}: {
  href: string;
  title: string;
  preview: string;
  isDraft: boolean;
  grade?: StrategyGrade;
  sectorNames: string[];
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col bg-white border border-[#E8E6E3] border-t-[3px] border-t-[#7A6B5A] hover:border-[#7A6B5A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-3 space-y-2">
        <h2 className="text-[15px] font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
          {title}
        </h2>
        {preview && (
          <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">
            {preview}
          </p>
        )}
      </div>

      {/* Badges row */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        {isDraft && (
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
            Draft
          </span>
        )}
        {grade && (
          <span
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${GRADE_COLOUR_CLASSES[grade.gradeLetter]}`}
          >
            Grade {grade.gradeLetter}
          </span>
        )}
        {grade && (
          <span className="text-[10px] text-[#9A9A9A]">
            {grade.gradeRationaleShort}
          </span>
        )}
      </div>

      {/* Sectors strip */}
      <div className="mx-5 border-t border-[#E8E6E3] pt-3 pb-4 mt-auto">
        <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-medium mb-1.5">
          Priority sectors
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
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
              +{sectorNames.length - 3} more
            </span>
          )}
          {sectorNames.length === 0 && (
            <span className="text-[10px] text-[#9A9A9A]">—</span>
          )}
        </div>
      </div>
    </Link>
  );
}
