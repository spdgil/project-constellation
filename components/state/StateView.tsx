"use client";

import { useEffect, useState, useCallback, useId } from "react";
import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { getDealsWithLocalOverrides } from "@/lib/deal-storage";
import {
  countByReadiness,
  countByConstraint,
  topConstraints,
  constraintSummaryByLga,
} from "@/lib/opportunities";
import { READINESS_LABELS } from "@/lib/labels";

const SECTION_IDS = [
  "pipeline-by-ot",
  "constraint-by-ot",
  "constraint-by-lga",
] as const;

export interface StateViewProps {
  opportunityTypes: OpportunityType[];
  deals: Deal[];
  lgas: LGA[];
}

export function StateView({
  opportunityTypes,
  deals: baseDeals,
  lgas,
}: StateViewProps) {
  const [deals, setDeals] = useState<Deal[]>(baseDeals);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDeals(getDealsWithLocalOverrides(baseDeals));
  }, [baseDeals]);

  const toggleSection = useCallback((id: (typeof SECTION_IDS)[number]) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isExpanded = (id: string) => openSections.has(id);
  const panelId = useId();

  return (
    <div className="max-w-4xl" data-testid="state-view">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          State aggregation
        </h1>
        <Link
          href="/"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>

      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8">
        Aggregates are computed from deals and reflect local edits.
      </p>

      <div className="space-y-0 border border-[#E8E6E3] bg-[#FFFFFF]">
        <AccordionSection
          id="pipeline-by-ot"
          heading="Pipeline summary by opportunity type"
          expanded={isExpanded("pipeline-by-ot")}
          onToggle={() => toggleSection("pipeline-by-ot")}
          controlsId={`${panelId}-pipeline`}
        >
          <PipelineByOt deals={deals} opportunityTypes={opportunityTypes} />
        </AccordionSection>

        <AccordionSection
          id="constraint-by-ot"
          heading="Constraint summary by opportunity type"
          expanded={isExpanded("constraint-by-ot")}
          onToggle={() => toggleSection("constraint-by-ot")}
          controlsId={`${panelId}-constraint-ot`}
        >
          <ConstraintByOt deals={deals} opportunityTypes={opportunityTypes} />
        </AccordionSection>

        <AccordionSection
          id="constraint-by-lga"
          heading="Constraint summary by LGA"
          expanded={isExpanded("constraint-by-lga")}
          onToggle={() => toggleSection("constraint-by-lga")}
          controlsId={`${panelId}-constraint-lga`}
        >
          <ConstraintByLga deals={deals} lgas={lgas} />
        </AccordionSection>
      </div>
    </div>
  );
}

function AccordionSection({
  id,
  heading,
  expanded,
  onToggle,
  controlsId,
  children,
}: {
  id: string;
  heading: string;
  expanded: boolean;
  onToggle: () => void;
  controlsId: string;
  children: React.ReactNode;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className="border-b border-[#F0EEEB] last:border-b-0"
      data-accordion-section={id}
    >
      <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]">
        <button
          type="button"
          id={controlsId}
          aria-expanded={expanded}
          aria-controls={`${controlsId}-content`}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className="w-full flex items-center justify-between gap-2 py-4 px-4 text-left border-0 bg-transparent text-sm text-[#2C2C2C] hover:bg-[#F5F3F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
        >
          {heading}
          <span className="text-[#6B6B6B] text-xs" aria-hidden>
            {expanded ? "−" : "+"}
          </span>
        </button>
      </h2>
      <div
        id={`${controlsId}-content`}
        role="region"
        aria-labelledby={controlsId}
        hidden={!expanded}
        className={expanded ? "px-4 pb-4" : "hidden"}
      >
        {children}
      </div>
    </div>
  );
}

function PipelineByOt({
  deals,
  opportunityTypes,
}: {
  deals: Deal[];
  opportunityTypes: OpportunityType[];
}) {
  return (
    <div className="space-y-4" data-testid="pipeline-by-ot">
      {opportunityTypes.map((ot) => {
        const typeDeals = deals.filter((d) => d.opportunityTypeId === ot.id);
        const readinessCounts = countByReadiness(typeDeals);
        return (
          <div
            key={ot.id}
            className="border border-[#E8E6E3] p-4 bg-[#FAF9F7]"
            data-testid={`pipeline-ot-${ot.id}`}
          >
            <p className="text-sm font-medium text-[#2C2C2C] mb-2">{ot.name}</p>
            {readinessCounts.length === 0 ? (
              <p className="text-xs text-[#6B6B6B]">No deals.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-1">
                {readinessCounts.map((r) => (
                  <li
                    key={r.readinessState}
                    className="text-sm text-[#2C2C2C] border-b border-[#F0EEEB] last:border-b-0 py-1"
                    data-testid={`readiness-${ot.id}-${r.readinessState}`}
                  >
                    {r.label}: {r.count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConstraintByOt({
  deals,
  opportunityTypes,
}: {
  deals: Deal[];
  opportunityTypes: OpportunityType[];
}) {
  return (
    <div className="space-y-4" data-testid="constraint-by-ot">
      {opportunityTypes.map((ot) => {
        const typeDeals = deals.filter((d) => d.opportunityTypeId === ot.id);
        const top = topConstraints(typeDeals, 5);
        return (
          <div
            key={ot.id}
            className="border border-[#E8E6E3] p-4 bg-[#FAF9F7]"
            data-testid={`constraint-ot-${ot.id}`}
          >
            <p className="text-sm font-medium text-[#2C2C2C] mb-2">{ot.name}</p>
            {top.length === 0 ? (
              <p className="text-xs text-[#6B6B6B]">No deals.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-1">
                {top.map((c) => (
                  <li
                    key={c.constraint}
                    className="text-sm text-[#2C2C2C] border-b border-[#F0EEEB] last:border-b-0 py-1"
                    data-testid={`constraint-${ot.id}-${c.constraint}`}
                  >
                    {c.label}: {c.count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConstraintByLga({
  deals,
  lgas,
}: {
  deals: Deal[];
  lgas: LGA[];
}) {
  const summary = constraintSummaryByLga(deals, lgas, 5);
  return (
    <div className="space-y-4" data-testid="constraint-by-lga">
      {summary.map(({ lgaId, lgaName, constraints }) => (
        <div
          key={lgaId}
          className="border border-[#E8E6E3] p-4 bg-[#FAF9F7]"
          data-testid={`constraint-lga-${lgaId}`}
        >
          <p className="text-sm font-medium text-[#2C2C2C] mb-2">{lgaName}</p>
          {constraints.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">No deals.</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-1">
              {constraints.map((c) => (
                <li
                  key={c.constraint}
                  className="text-sm text-[#2C2C2C] border-b border-[#F0EEEB] last:border-b-0 py-1"
                  data-testid={`constraint-lga-${lgaId}-${c.constraint}`}
                >
                  {c.label}: {c.count}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
