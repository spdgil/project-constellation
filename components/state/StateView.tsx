"use client";

import { useMemo, useState, useCallback, useId } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import {
  countByReadiness,
  topConstraints,
  constraintSummaryByLga,
} from "@/lib/opportunities";
import { AccordionSection } from "@/components/ui/AccordionSection";

// Lazy-load MapView to avoid shipping Mapbox JS when the user is on the
// aggregation tab. SSR disabled because Mapbox requires browser APIs.
const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-[600px] bg-[#FAF9F7] animate-pulse" /> },
);

const TABS = ["aggregation", "map"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  aggregation: "Aggregation",
  map: "Map",
};

type SectionId = "pipeline-by-ot" | "constraint-by-ot" | "constraint-by-lga";

export interface StateViewProps {
  opportunityTypes: OpportunityType[];
  deals: Deal[];
  lgas: LGA[];
  /** Pre-selected tab (e.g. when navigating from /map redirect). */
  initialTab?: Tab;
}

export function StateView({
  opportunityTypes,
  deals: baseDeals,
  lgas,
  initialTab = "aggregation",
}: StateViewProps) {
  const deals = useDealsWithOverrides(baseDeals);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((id: SectionId) => {
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
    <div data-testid="state-view">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          State
        </h1>
        <Link
          href="/"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[#E8E6E3] mb-4" role="tablist" aria-label="State view tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`
              text-sm px-4 py-2 -mb-px
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]
              transition duration-200 ease-out
              ${
                activeTab === tab
                  ? "text-[#2C2C2C] border-b-2 border-[#2C2C2C] font-medium"
                  : "text-[#6B6B6B] border-b-2 border-transparent hover:text-[#2C2C2C] hover:border-[#C8C4BF]"
              }
            `}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "aggregation" && (
        <div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4">
            Aggregates are computed from deals and reflect local edits.
          </p>

          <div className="space-y-0 border border-[#E8E6E3] bg-[#FFFFFF]">
            <AccordionSection
              id="pipeline-by-ot"
              heading="Pipeline summary by opportunity type"
              expanded={isExpanded("pipeline-by-ot")}
              onToggle={() => toggleSection("pipeline-by-ot")}
              controlsId={`${panelId}-pipeline`}
              headingLevel="h2"
              contentClassName="px-4 pb-4"
            >
              <PipelineByOt deals={deals} opportunityTypes={opportunityTypes} />
            </AccordionSection>

            <AccordionSection
              id="constraint-by-ot"
              heading="Constraint summary by opportunity type"
              expanded={isExpanded("constraint-by-ot")}
              onToggle={() => toggleSection("constraint-by-ot")}
              controlsId={`${panelId}-constraint-ot`}
              headingLevel="h2"
              contentClassName="px-4 pb-4"
            >
              <ConstraintByOt deals={deals} opportunityTypes={opportunityTypes} />
            </AccordionSection>

            <AccordionSection
              id="constraint-by-lga"
              heading="Constraint summary by LGA"
              expanded={isExpanded("constraint-by-lga")}
              onToggle={() => toggleSection("constraint-by-lga")}
              controlsId={`${panelId}-constraint-lga`}
              headingLevel="h2"
              contentClassName="px-4 pb-4"
            >
              <ConstraintByLga deals={deals} lgas={lgas} />
            </AccordionSection>
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <div className="h-[calc(100vh-200px)] min-h-[500px]">
          <MapView
            lgas={lgas}
            deals={deals}
            opportunityTypes={opportunityTypes}
          />
        </div>
      )}
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
  const dealsByOt = useMemo(() => indexDealsByOt(deals), [deals]);
  return (
    <div className="space-y-4" data-testid="pipeline-by-ot">
      {opportunityTypes.map((ot) => {
        const typeDeals = dealsByOt.get(ot.id) ?? [];
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
  const dealsByOt = useMemo(() => indexDealsByOt(deals), [deals]);
  return (
    <div className="space-y-4" data-testid="constraint-by-ot">
      {opportunityTypes.map((ot) => {
        const typeDeals = dealsByOt.get(ot.id) ?? [];
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

/** Pre-index deals by opportunityTypeId to avoid repeated .filter() calls. */
function indexDealsByOt(deals: Deal[]): Map<string, Deal[]> {
  const map = new Map<string, Deal[]>();
  for (const d of deals) {
    const arr = map.get(d.opportunityTypeId);
    if (arr) arr.push(d);
    else map.set(d.opportunityTypeId, [d]);
  }
  return map;
}
