"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import {
  countByReadiness,
  countByConstraint,
  constraintsAcrossLgas,
  stallPoints,
  dealLgaNames,
} from "@/lib/opportunities";
import { READINESS_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";

export interface OpportunityDetailProps {
  opportunityType: OpportunityType;
  deals: Deal[];
  lgas: LGA[];
}

export function OpportunityDetail({
  opportunityType: ot,
  deals: baseDeals,
  lgas,
}: OpportunityDetailProps) {
  const deals = useDealsWithOverrides(baseDeals);

  const { typeDeals, readinessDist, constraintDist, replicationConstraints, replicationStallPoints, totalDeals, maxReadinessCount } = useMemo(() => {
    const td = deals.filter((d) => d.opportunityTypeId === ot.id);
    const rd = countByReadiness(td);
    return {
      typeDeals: td,
      readinessDist: rd,
      constraintDist: countByConstraint(td),
      replicationConstraints: constraintsAcrossLgas(td),
      replicationStallPoints: stallPoints(td),
      totalDeals: td.length,
      maxReadinessCount: Math.max(...rd.map((r) => r.count), 1),
    };
  }, [deals, ot.id]);

  return (
    <div data-testid="opportunity-detail">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/opportunities"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          ← Opportunity types
        </Link>
        <Link
          href="/"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C] mb-6">
        {ot.name}
      </h1>

      <div className="grid md:grid-cols-3 md:gap-8 gap-6">
        {/* Primary content — definition + deals */}
        <div className="md:col-span-2 space-y-8">
          <section aria-labelledby="definition-heading">
            <h2
              id="definition-heading"
              className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
            >
              Definition
            </h2>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">{ot.definition}</p>
          </section>

          <section aria-labelledby="deals-heading">
            <h2
              id="deals-heading"
              className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-3"
            >
              Deals ({totalDeals})
            </h2>
            {typeDeals.length === 0 ? (
              <p className="text-sm text-[#6B6B6B] leading-relaxed">No deals.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-3" data-testid="deals-list">
                {typeDeals.map((d) => (
                  <li
                    key={d.id}
                    className="p-3 border border-[#E8E6E3] bg-[#FFFFFF]"
                  >
                    <p className="text-sm text-[#2C2C2C] leading-relaxed font-medium">
                      {d.name}
                    </p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {dealLgaNames(d, lgas).join(", ")} ·{" "}
                      {READINESS_LABELS[d.readinessState]} ·{" "}
                      {CONSTRAINT_LABELS[d.dominantConstraint]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar card — distributions + replication signals */}
        <div className="md:col-span-1 bg-[#FAF9F7] border border-[#E8E6E3] p-4 space-y-6 self-start">
          <section aria-labelledby="readiness-heading">
            <h2
              id="readiness-heading"
              className="font-heading text-sm font-normal leading-[1.4] text-[#2C2C2C] mb-3"
            >
              Readiness distribution
            </h2>
            {readinessDist.length === 0 ? (
              <p className="text-sm text-[#6B6B6B] leading-relaxed">No data.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-2" data-testid="readiness-distribution">
                {readinessDist.map((r) => (
                  <li key={r.readinessState} className="flex items-center gap-3">
                    <span
                      className="h-4 border border-[#E8E6E3] bg-[#F5F3F0] min-w-0 flex-shrink-0"
                      style={{
                        width: `${(r.count / maxReadinessCount) * 120}px`,
                      }}
                      aria-hidden
                    />
                    <span className="text-sm text-[#2C2C2C]">
                      {r.label}: {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="constraint-heading">
            <h2
              id="constraint-heading"
              className="font-heading text-sm font-normal leading-[1.4] text-[#2C2C2C] mb-3"
            >
              Constraint distribution
            </h2>
            {constraintDist.length === 0 ? (
              <p className="text-sm text-[#6B6B6B] leading-relaxed">No data.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-1" data-testid="constraint-distribution">
                {constraintDist.map((c) => (
                  <li key={c.constraint} className="text-sm text-[#2C2C2C]">
                    {c.label}: {c.count}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="replication-heading">
            <h2
              id="replication-heading"
              className="font-heading text-sm font-normal leading-[1.4] text-[#2C2C2C] mb-3"
            >
              Replication signals
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-xs font-normal leading-[1.4] text-[#2C2C2C] mb-2">
                  Repeated constraint across LGAs
                </h3>
                {replicationConstraints.length === 0 ? (
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    None (constraint in 2+ LGAs).
                  </p>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-1" data-testid="replication-constraints">
                    {replicationConstraints.map((c) => (
                      <li key={c.constraint} className="text-sm text-[#2C2C2C]">
                        {c.label} in {c.lgaCount} LGAs
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-heading text-xs font-normal leading-[1.4] text-[#2C2C2C] mb-2">
                  Multiple deals at same readiness
                </h3>
                {replicationStallPoints.length === 0 ? (
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    None (2+ deals at same stage).
                  </p>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-1" data-testid="replication-stall-points">
                    {replicationStallPoints.map((r) => (
                      <li key={r.readinessState} className="text-sm text-[#2C2C2C]">
                        {r.count} deals at {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
