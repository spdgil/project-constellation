"use client";

import { useCallback, useId, useState } from "react";
import type { LGA, Deal } from "@/lib/types";
import { CONSTRAINT_LABELS } from "@/lib/labels";
import { AccordionSection } from "@/components/ui/AccordionSection";

const SECTION_IDS = [
  "summary",
  "opportunity-hypotheses",
  "active-deals",
  "repeated-constraints",
  "evidence-notes",
] as const;

export interface LgaDetailPanelProps {
  lga: LGA;
  deals: Deal[];
  onClose: () => void;
}

/** Headless detail content for an LGA. Rendered inside LgaBottomSheet. */
export function LgaDetailPanel({ lga, deals }: LgaDetailPanelProps) {
  const panelId = useId();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["summary"]));

  const toggleSection = useCallback((id: (typeof SECTION_IDS)[number]) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isExpanded = (id: string) => openSections.has(id);

  const summary = lga.summary ?? `${lga.name} (LGA). Place context will appear here when connected.`;
  const hypotheses = lga.opportunityHypotheses ?? [];
  const activeDealIds = lga.activeDealIds ?? [];
  const activeDeals = deals.filter((d) => activeDealIds.includes(d.id));
  const repeatedConstraints = lga.repeatedConstraints ?? [];
  const evidence = lga.evidence ?? [];
  const notes = lga.notes ?? [];

  return (
    <div
      data-lga-panel={lga.id}
      className="flex flex-col min-h-0"
    >
      <div className="flex-1 overflow-auto p-3 space-y-0">
        <AccordionSection
          id="summary"
          heading="Summary"
          expanded={isExpanded("summary")}
          onToggle={() => toggleSection("summary")}
          controlsId={`${panelId}-summary`}
        >
          <p className="text-sm text-[#2C2C2C] leading-relaxed">{summary}</p>
        </AccordionSection>

        <AccordionSection
          id="opportunity-hypotheses"
          heading="Opportunity hypotheses"
          expanded={isExpanded("opportunity-hypotheses")}
          onToggle={() => toggleSection("opportunity-hypotheses")}
          controlsId={`${panelId}-hypotheses`}
        >
          {hypotheses.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">None recorded.</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-3">
              {hypotheses.map((h) => (
                <li key={h.id}>
                  <h4 className="font-heading text-sm font-normal leading-[1.4] text-[#2C2C2C] mb-1">
                    {h.name}
                  </h4>
                  {h.summary && (
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{h.summary}</p>
                  )}
                  {h.dominantConstraint && (
                    <p className="text-xs text-[#9A9A9A] mt-1">
                      {CONSTRAINT_LABELS[h.dominantConstraint]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AccordionSection>

        <AccordionSection
          id="active-deals"
          heading="Active deals"
          expanded={isExpanded("active-deals")}
          onToggle={() => toggleSection("active-deals")}
          controlsId={`${panelId}-deals`}
        >
          {activeDeals.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">None recorded.</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-2">
              {activeDeals.map((d) => (
                <li key={d.id} className="text-sm text-[#2C2C2C] leading-relaxed">
                  {d.name}
                </li>
              ))}
            </ul>
          )}
        </AccordionSection>

        <AccordionSection
          id="repeated-constraints"
          heading="Repeated constraints"
          expanded={isExpanded("repeated-constraints")}
          onToggle={() => toggleSection("repeated-constraints")}
          controlsId={`${panelId}-constraints`}
        >
          {repeatedConstraints.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">None recorded.</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-1">
              {repeatedConstraints.map((c) => (
                <li key={c} className="text-sm text-[#2C2C2C] leading-relaxed">
                  {CONSTRAINT_LABELS[c]}
                </li>
              ))}
            </ul>
          )}
        </AccordionSection>

        <AccordionSection
          id="evidence-notes"
          heading="Evidence and notes"
          expanded={isExpanded("evidence-notes")}
          onToggle={() => toggleSection("evidence-notes")}
          controlsId={`${panelId}-evidence`}
        >
          <div className="space-y-3">
            {evidence.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                  Evidence
                </p>
                <ul className="list-none p-0 m-0 space-y-1">
                  {evidence.map((e, i) => (
                    <li key={i} className="text-sm text-[#2C2C2C] leading-relaxed">
                      {e.label ?? e.pageRef ?? "—"}
                      {e.pageRef && e.label && ` (${e.pageRef})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {notes.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                  Notes
                </p>
                <ul className="list-none p-0 m-0 space-y-1">
                  {notes.map((n, i) => (
                    <li key={i} className="text-sm text-[#2C2C2C] leading-relaxed">
                      {typeof n === "string" ? n : String(n)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evidence.length === 0 && notes.length === 0 && (
              <p className="text-sm text-[#6B6B6B] leading-relaxed">None recorded.</p>
            )}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}

