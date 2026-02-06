"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import {
  countByReadiness,
  topConstraints,
} from "@/lib/opportunities";
import { READINESS_LABELS } from "@/lib/labels";

export interface OpportunitiesIndexProps {
  opportunityTypes: OpportunityType[];
  deals: Deal[];
  lgas: LGA[];
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

export function OpportunitiesIndex({
  opportunityTypes,
  deals: baseDeals,
  lgas: _lgas,
}: OpportunitiesIndexProps) {
  const deals = useDealsWithOverrides(baseDeals);
  const dealsByOt = useMemo(() => indexDealsByOt(deals), [deals]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          Opportunity types
        </h1>
        <Link
          href="/"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>

      <ul className="list-none p-0 m-0 space-y-4" data-testid="opportunity-types-list">
        {opportunityTypes.map((ot) => {
          const typeDeals = dealsByOt.get(ot.id) ?? [];
          const readinessCounts = countByReadiness(typeDeals);
          const top = topConstraints(typeDeals, 2);
          const readinessSummary =
            readinessCounts.length === 0
              ? "No deals"
              : readinessCounts
                  .map((r) => `${READINESS_LABELS[r.readinessState]} (${r.count})`)
                  .join(", ");
          const constraintSummary =
            top.length === 0
              ? "—"
              : top.map((c) => `${c.label} (${c.count})`).join(", ");

          return (
            <li key={ot.id}>
              <Link
                href={`/opportunities/${ot.id}`}
                className="block p-4 border border-[#E8E6E3] bg-[#FFFFFF] hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
              >
                <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-2">
                  {ot.name}
                </h2>
                <p className="text-sm text-[#6B6B6B] leading-relaxed mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#9A9A9A]">
                    Deals by readiness
                  </span>{" "}
                  {readinessSummary}
                </p>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">
                  <span className="text-[10px] uppercase tracking-wider text-[#9A9A9A]">
                    Top constraints
                  </span>{" "}
                  {constraintSummary}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
