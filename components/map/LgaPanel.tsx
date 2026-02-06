"use client";

import type { LGA, Deal } from "@/lib/types";
import { LgaDetailPanel } from "./LgaDetailPanel";

export interface LgaPanelProps {
  lgas: LGA[];
  deals: Deal[];
  selectedLgaId: string | null;
  onSelectLga: (id: string | null) => void;
}

export function LgaPanel({
  lgas,
  deals,
  selectedLgaId,
  onSelectLga,
}: LgaPanelProps) {
  return (
    <div className="w-64 border-r border-[#E8E6E3] bg-[#FAF9F7] flex flex-col min-h-0">
      <div className="p-3 border-b border-[#E8E6E3]">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]">
          LGAs
        </h2>
      </div>
      <nav
        aria-label="LGA list"
        className="flex-1 overflow-auto p-2 min-h-0"
      >
        <ul className="list-none p-0 m-0 space-y-1">
          {lgas.map((lga) => {
            const isSelected = selectedLgaId === lga.id;
            return (
              <li key={lga.id}>
                <button
                  type="button"
                  data-lga-button={lga.id}
                  aria-pressed={isSelected}
                  onClick={() => onSelectLga(isSelected ? null : lga.id)}
                  className="w-full text-left px-3 py-2 border border-transparent bg-transparent text-sm text-[#2C2C2C] hover:bg-[#F5F3F0] hover:border-[#E8E6E3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out aria-pressed:bg-[#F5F3F0] aria-pressed:border-[#E8E6E3]"
                >
                  {lga.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      {selectedLgaId && (() => {
        const selectedLga = lgas.find((l) => l.id === selectedLgaId);
        if (!selectedLga) return null;
        return (
          <LgaDetailPanel
            lga={selectedLga}
            deals={deals}
            onClose={() => onSelectLga(null)}
          />
        );
      })()}
    </div>
  );
}
