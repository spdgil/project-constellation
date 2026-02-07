"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SectorOpportunity } from "@/lib/types";
import { SECTOR_OPPORTUNITY_SECTION_NAMES } from "@/lib/types";

export interface SectorOpportunitiesIndexProps {
  sectorOpportunities: SectorOpportunity[];
}

/**
 * Humanise a snake_case tag into a readable label.
 * e.g. "energy_transition" → "Energy transition"
 */
function humaniseTag(tag: string): string {
  return tag
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function SectorOpportunitiesIndex({
  sectorOpportunities,
}: SectorOpportunitiesIndexProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive all unique tags for the filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const so of sectorOpportunities) {
      for (const t of so.tags) set.add(t);
    }
    return Array.from(set).sort();
  }, [sectorOpportunities]);

  // Filter sector opportunities by query + tag
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
        // Search section 1 (definition) as a preview
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

  // Reset highlight on filter change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, tagFilter]);

  useEffect(() => {
    if (highlightedIndex < 0) setHighlightedIndex(0);
    if (highlightedIndex >= filtered.length)
      setHighlightedIndex(Math.max(0, filtered.length - 1));
  }, [highlightedIndex, filtered.length]);

  const navigateTo = useCallback(
    (so: SectorOpportunity) => {
      router.push(`/sectors/${so.id}`);
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

  // Scroll highlighted item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-result-index="${highlightedIndex}"]`,
    );
    if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
      (el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  const selectClassName =
    "h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out";

  return (
    <div className="flex flex-col gap-4" data-testid="sectors-index">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          Sector Opportunities
        </h1>
        <Link
          href="/"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3">
        <label htmlFor="sectors-search-input" className="sr-only">
          Filter sector opportunities by name or tag
        </label>
        <input
          ref={inputRef}
          id="sectors-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by sector name, tag, or definition"
          aria-label="Filter sector opportunities by name or tag"
          aria-controls="sectors-results-list"
          aria-expanded={filtered.length > 0}
          aria-activedescendant={
            filtered[highlightedIndex]
              ? `sector-result-${filtered[highlightedIndex].id}`
              : undefined
          }
          role="combobox"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full h-10 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="sectors-search-input"
        />

        {/* Tag filter */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filter by tag"
            className={selectClassName}
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
            {filtered.length === 1 ? "sector opportunity" : "sector opportunities"}
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
        id="sectors-results-list"
        role="listbox"
        aria-label="Sector opportunity search results"
        className="list-none p-0 m-0 space-y-1 max-h-[60vh] overflow-auto border border-[#E8E6E3] bg-white"
        onKeyDown={handleKeyDown}
        data-testid="sectors-results-list"
      >
        {filtered.length === 0 ? (
          <li className="p-4 text-sm text-[#6B6B6B]">
            {hasActiveFilters
              ? "No sector opportunities match your filters."
              : "No sector opportunities available."}
          </li>
        ) : (
          filtered.map((so, index) => {
            const isHighlighted = index === highlightedIndex;
            const definition = so.sections["1"] ?? "";
            const preview =
              definition.length > 180
                ? definition.slice(0, 180) + "…"
                : definition;

            return (
              <li
                key={so.id}
                role="option"
                id={`sector-result-${so.id}`}
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
                onClick={() => navigateTo(so)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateTo(so);
                  }
                }}
              >
                <p className="text-sm text-[#2C2C2C] leading-relaxed font-medium">
                  {so.name}
                </p>
                {preview && (
                  <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                    {preview}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {so.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                    >
                      {humaniseTag(tag)}
                    </span>
                  ))}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
