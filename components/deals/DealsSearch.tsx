"use client";

import { useMemo, useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { Deal, DealStage, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { filterDealsByQuery } from "@/lib/deals-search";
import type { DealFilterParams } from "@/lib/deals-search";
import { dealLgaNames } from "@/lib/opportunities";
import { STAGE_LABELS, READINESS_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES, READINESS_COLOUR_CLASSES } from "@/lib/stage-colours";
import { DealDrawer } from "@/components/map/DealDrawer";

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
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const selectedDeal = selectedDealId
    ? deals.find((d) => d.id === selectedDealId) ?? null
    : null;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, stageFilter, otFilter, lgaFilter]);

  useEffect(() => {
    if (highlightedIndex < 0) setHighlightedIndex(0);
    if (highlightedIndex >= filtered.length) setHighlightedIndex(Math.max(0, filtered.length - 1));
  }, [highlightedIndex, filtered.length]);

  const selectDeal = useCallback(
    (deal: Deal) => {
      setSelectedDealId(deal.id);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedDealId) {
          setSelectedDealId(null);
          e.preventDefault();
        }
        return;
      }
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
        selectDeal(filtered[highlightedIndex]);
        return;
      }
    },
    [filtered, highlightedIndex, selectDeal, selectedDealId]
  );

  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-deal-result-index="${highlightedIndex}"]`
    );
    if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
      (el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  const getOpportunityTypeName = (deal: Deal) =>
    opportunityTypes.find((o) => o.id === deal.opportunityTypeId)?.name ?? deal.opportunityTypeId;

  const selectClassName = "h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out";

  return (
    <div className="flex flex-col gap-4" data-testid="deals-search">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          Search deals
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
        <label htmlFor="deals-search-input" className="sr-only">
          Filter deals by name, opportunity type, or LGA name
        </label>
        <input
          ref={inputRef}
          id="deals-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by deal name, opportunity type, or LGA name"
          aria-label="Filter deals by name, opportunity type, or LGA name"
          aria-controls="deals-results-list"
          aria-expanded={filtered.length > 0}
          aria-activedescendant={
            filtered[highlightedIndex]
              ? `deals-result-${filtered[highlightedIndex].id}`
              : undefined
          }
          role="combobox"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full h-10 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          data-testid="deals-search-input"
        />

        {/* Faceted filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={otFilter}
            onChange={(e) => setOtFilter(e.target.value)}
            aria-label="Filter by opportunity type"
            className={selectClassName}
            data-testid="filter-opportunity-type"
          >
            <option value="">All opportunity types</option>
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
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results grid: list + drawer */}
      <div className={`grid gap-6 ${selectedDeal ? "md:grid-cols-2" : ""}`}>
        <div className="min-w-0">
          <ul
            ref={listRef}
            id="deals-results-list"
            role="listbox"
            aria-label="Deal search results"
            className="list-none p-0 m-0 space-y-1 max-h-[60vh] overflow-auto border border-[#E8E6E3] bg-[#FFFFFF]"
            onKeyDown={handleKeyDown}
            data-testid="deals-results-list"
          >
            {filtered.length === 0 ? (
              <li className="p-4 text-sm text-[#6B6B6B]">
                {hasActiveFilters ? "No deals match your filters." : "No deals available."}
              </li>
            ) : (
              filtered.map((deal, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = deal.id === selectedDealId;
                const lgaNames = dealLgaNames(deal, lgas).join(", ");
                const otName = getOpportunityTypeName(deal);
                return (
                  <li
                    key={deal.id}
                    role="option"
                    id={`deals-result-${deal.id}`}
                    data-deal-result-index={index}
                    aria-selected={isHighlighted}
                    tabIndex={-1}
                    className={[
                      "p-3 text-left cursor-pointer transition duration-300 ease-out",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]",
                      isSelected
                        ? "border-l-2 border-l-[#2C2C2C] bg-[#F5F3F0] border-y border-r border-y-[#E8E6E3] border-r-transparent"
                        : isHighlighted
                          ? "border border-[#E8E6E3] bg-[#F5F3F0]"
                          : "border border-transparent hover:bg-[#F5F3F0]",
                    ].join(" ")}
                    onClick={() => selectDeal(deal)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectDeal(deal);
                      }
                    }}
                  >
                    <p className="text-sm text-[#2C2C2C] leading-relaxed font-medium">
                      {deal.name}
                    </p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {otName} · {lgaNames || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[deal.stage]}`}>
                        {STAGE_LABELS[deal.stage]}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${READINESS_COLOUR_CLASSES[deal.readinessState]}`}>
                        {READINESS_LABELS[deal.readinessState]}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {selectedDeal && (
          <div className="min-w-0">
            <DealDrawer
              deal={selectedDeal}
              opportunityTypes={opportunityTypes}
              lgas={lgas}
              onClose={() => setSelectedDealId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
