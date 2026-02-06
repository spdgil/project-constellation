"use client";

import { useMemo, useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { filterDealsByQuery } from "@/lib/deals-search";
import { dealLgaNames } from "@/lib/opportunities";
import { DealDrawer } from "@/components/map/DealDrawer";

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

  const filtered = useMemo(
    () => filterDealsByQuery(deals, query, opportunityTypes, lgas),
    [deals, query, opportunityTypes, lgas],
  );
  const selectedDeal = selectedDealId
    ? deals.find((d) => d.id === selectedDealId) ?? null
    : null;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

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

  return (
    <div className="max-w-4xl flex flex-col gap-6" data-testid="deals-search">
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

      <div className="flex flex-1 min-h-0 gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#6B6B6B] mb-2">
            {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
          </p>
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
                {query.trim() ? "No deals match your search." : "Enter a search to filter deals."}
              </li>
            ) : (
              filtered.map((deal, index) => {
                const isHighlighted = index === highlightedIndex;
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
                    className={`p-3 border border-transparent text-left cursor-pointer transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] ${
                      isHighlighted ? "bg-[#F5F3F0] border-[#E8E6E3]" : "hover:bg-[#F5F3F0]"
                    }`}
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
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {selectedDeal && (
          <div className="w-80 shrink-0">
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
