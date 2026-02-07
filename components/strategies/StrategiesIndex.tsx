"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  SectorDevelopmentStrategy,
  StrategyGrade,
  SectorOpportunity,
  GradeLetter,
} from "@/lib/types";

/** Colour classes for grade letters — design system semantic colours. */
const GRADE_COLOUR_CLASSES: Record<GradeLetter, string> = {
  A: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "A-": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  B: "bg-blue-50 text-blue-700 border border-blue-200",
  "B-": "bg-blue-50 text-blue-700 border border-blue-200",
  C: "bg-amber-50 text-amber-700 border border-amber-200",
  D: "bg-orange-50 text-orange-700 border border-orange-200",
  F: "bg-red-50 text-red-700 border border-red-200",
};

export interface StrategiesIndexProps {
  strategies: SectorDevelopmentStrategy[];
  strategyGrades: StrategyGrade[];
  sectorOpportunities: SectorOpportunity[];
}

export function StrategiesIndex({
  strategies,
  strategyGrades,
  sectorOpportunities,
}: StrategiesIndexProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build a grade lookup
  const gradeByStrategyId = useMemo(() => {
    const map = new Map<string, StrategyGrade>();
    for (const g of strategyGrades) {
      map.set(g.strategyId, g);
    }
    return map;
  }, [strategyGrades]);

  // Build a sector opportunity name lookup
  const soNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const so of sectorOpportunities) {
      map.set(so.id, so.name);
    }
    return map;
  }, [sectorOpportunities]);

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

  const clearFilters = useCallback(() => {
    setQuery("");
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex < 0) setHighlightedIndex(0);
    if (highlightedIndex >= filtered.length)
      setHighlightedIndex(Math.max(0, filtered.length - 1));
  }, [highlightedIndex, filtered.length]);

  const navigateTo = useCallback(
    (s: SectorDevelopmentStrategy) => {
      const path =
        s.status === "draft"
          ? `/strategies/${s.id}/draft`
          : `/strategies/${s.id}`;
      router.push(path);
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && filtered[highlightedIndex]) {
        e.preventDefault();
        navigateTo(filtered[highlightedIndex]);
        return;
      }
    },
    [filtered, highlightedIndex, navigateTo],
  );

  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-result-index="${highlightedIndex}"]`,
    );
    if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
      (el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  return (
    <div className="flex flex-col gap-4" data-testid="strategies-index">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          Sector Development Strategies
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/strategies/upload"
            className="text-sm px-3 py-1.5 bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out"
          >
            Upload strategy
          </Link>
          <Link
            href="/"
            className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
          >
            Back to home
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-col gap-3">
        <label htmlFor="strategies-search-input" className="sr-only">
          Filter strategies by title or summary
        </label>
        <input
          ref={inputRef}
          id="strategies-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by strategy title or summary"
          aria-label="Filter strategies by title or summary"
          aria-controls="strategies-results-list"
          aria-expanded={filtered.length > 0}
          aria-activedescendant={
            filtered[highlightedIndex]
              ? `strategy-result-${filtered[highlightedIndex].id}`
              : undefined
          }
          role="combobox"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full h-10 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="strategies-search-input"
        />

        <div className="flex flex-wrap items-center gap-3">
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
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results list */}
      <ul
        ref={listRef}
        id="strategies-results-list"
        role="listbox"
        aria-label="Strategy search results"
        className="list-none p-0 m-0 space-y-1 max-h-[60vh] overflow-auto border border-[#E8E6E3] bg-white"
        onKeyDown={handleKeyDown}
        data-testid="strategies-results-list"
      >
        {filtered.length === 0 ? (
          <li className="p-4 text-sm text-[#6B6B6B]">
            {hasActiveFilters
              ? "No strategies match your search."
              : "No strategies available."}
          </li>
        ) : (
          filtered.map((s, index) => {
            const isHighlighted = index === highlightedIndex;
            const grade = gradeByStrategyId.get(s.id);
            const sectorNames = s.prioritySectorIds
              .map((sid) => soNameById.get(sid))
              .filter(Boolean) as string[];
            const preview =
              s.summary.length > 200
                ? s.summary.slice(0, 200) + "…"
                : s.summary;

            return (
              <li
                key={s.id}
                role="option"
                id={`strategy-result-${s.id}`}
                data-result-index={index}
                aria-selected={isHighlighted}
                tabIndex={-1}
                className={[
                  "p-3 text-left cursor-pointer transition duration-300 ease-out",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]",
                  isHighlighted
                    ? "border border-[#E8E6E3] bg-[#F5F3F0]"
                    : "border border-transparent hover:bg-[#F5F3F0]",
                ].join(" ")}
                onClick={() => navigateTo(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateTo(s);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#2C2C2C] leading-relaxed font-medium">
                    {s.title}
                  </p>
                  {s.status === "draft" && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
                      Draft
                    </span>
                  )}
                  {grade && (
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 shrink-0 ${GRADE_COLOUR_CLASSES[grade.gradeLetter]}`}
                    >
                      Grade {grade.gradeLetter}
                    </span>
                  )}
                </div>
                {preview && (
                  <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                    {preview}
                  </p>
                )}
                {sectorNames.length > 0 && (
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    {sectorNames.length} priority{" "}
                    {sectorNames.length === 1 ? "sector" : "sectors"}
                    {" · "}
                    {sectorNames.slice(0, 3).join(", ")}
                    {sectorNames.length > 3 && ` +${sectorNames.length - 3} more`}
                  </p>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
