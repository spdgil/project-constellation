"use client";

import { useMemo, useState } from "react";
import type { LGA } from "@/lib/types";

export interface LgaPanelProps {
  lgas: LGA[];
  selectedLgaId: string | null;
  onSelectLga: (id: string | null) => void;
}

/** Sidebar LGA list — pure navigation; detail is shown in the bottom sheet. */
export function LgaPanel({
  lgas,
  selectedLgaId,
  onSelectLga,
}: LgaPanelProps) {
  const [otherExpanded, setOtherExpanded] = useState(false);
  const [search, setSearch] = useState("");

  // Split into focus LGAs (have summaries / boundaries) and catalogue-only
  const { focusLgas, otherLgas } = useMemo(() => {
    const focus: LGA[] = [];
    const other: LGA[] = [];
    for (const lga of lgas) {
      if (lga.summary) {
        focus.push(lga);
      } else {
        other.push(lga);
      }
    }
    return { focusLgas: focus, otherLgas: other };
  }, [lgas]);

  // Filter "other" LGAs by search
  const filteredOther = useMemo(() => {
    if (!search.trim()) return otherLgas;
    const q = search.toLowerCase();
    return otherLgas.filter((l) => l.name.toLowerCase().includes(q));
  }, [otherLgas, search]);

  return (
    <div className="w-52 border-r border-[#E8E6E3] bg-[#FAF9F7] flex flex-col min-h-0">
      {/* Focus region header */}
      <div className="p-3 border-b border-[#E8E6E3]">
        <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-[#6B6B6B]">
          Greater Whitsunday
        </h2>
      </div>

      <nav
        aria-label="LGA list"
        className="flex-1 overflow-auto min-h-0"
      >
        {/* Focus LGAs — always visible */}
        <ul className="list-none p-0 m-0">
          {focusLgas.map((lga) => {
            const isSelected = selectedLgaId === lga.id;
            const dealCount = lga.activeDealIds?.length ?? 0;
            return (
              <li key={lga.id}>
                <button
                  type="button"
                  data-lga-button={lga.id}
                  aria-pressed={isSelected}
                  onClick={() => onSelectLga(isSelected ? null : lga.id)}
                  className="w-full text-left px-3 py-2.5 border-b border-[#F0EEED] bg-transparent text-sm text-[#2C2C2C] hover:bg-[#F5F3F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-200 ease-out aria-pressed:bg-[#EDEAE7] aria-pressed:font-medium"
                >
                  <span className="block">{lga.name}</span>
                  {dealCount > 0 && (
                    <span className="text-[11px] text-[#999]">
                      {dealCount} deal{dealCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Divider + collapsible other LGAs */}
        {otherLgas.length > 0 && (
          <div className="border-t border-[#E8E6E3]">
            <button
              type="button"
              onClick={() => setOtherExpanded((prev) => !prev)}
              className="w-full text-left px-3 py-2.5 flex items-center justify-between text-[11px] uppercase tracking-wider text-[#999] hover:text-[#6B6B6B] hover:bg-[#F5F3F0] transition duration-200"
            >
              <span>Other QLD LGAs ({otherLgas.length})</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${otherExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {otherExpanded && (
              <div>
                {/* Search */}
                <div className="px-2 pb-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full text-xs text-[#2C2C2C] border border-[#E8E6E3] rounded px-2 py-1.5 bg-white placeholder:text-[#BBB] focus:outline-none focus:ring-1 focus:ring-[#7A6B5A]"
                  />
                </div>

                <ul className="list-none p-0 m-0 max-h-48 overflow-y-auto">
                  {filteredOther.map((lga) => {
                    const isSelected = selectedLgaId === lga.id;
                    return (
                      <li key={lga.id}>
                        <button
                          type="button"
                          data-lga-button={lga.id}
                          aria-pressed={isSelected}
                          onClick={() => onSelectLga(isSelected ? null : lga.id)}
                          className="w-full text-left px-3 py-1.5 bg-transparent text-xs text-[#6B6B6B] hover:bg-[#F5F3F0] hover:text-[#2C2C2C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] transition duration-200 ease-out aria-pressed:bg-[#EDEAE7] aria-pressed:text-[#2C2C2C] aria-pressed:font-medium"
                        >
                          {lga.name}
                        </button>
                      </li>
                    );
                  })}
                  {filteredOther.length === 0 && (
                    <li className="px-3 py-2 text-xs text-[#BBB]">No match</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
