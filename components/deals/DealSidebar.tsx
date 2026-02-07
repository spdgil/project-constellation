import Link from "next/link";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { STAGE_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES } from "@/lib/stage-colours";

export interface DealSidebarProps {
  deal: Deal;
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
  /** All deals, used to derive "related deals" (same LGA). */
  allDeals: Deal[];
}

/**
 * Contextual sidebar for the full-page deal detail.
 * - Opportunity Type card: definition, typical capital stack, typical risks
 * - LGA Context card: summary, repeated constraints
 * - Related Deals card: other deals in the same LGA(s) as compact links with stage badges
 */
export function DealSidebar({
  deal,
  opportunityTypes,
  lgas,
  allDeals,
}: DealSidebarProps) {
  const opportunityType = opportunityTypes.find(
    (o) => o.id === deal.opportunityTypeId,
  );

  const dealLgas = lgas.filter((l) => deal.lgaIds.includes(l.id));

  const relatedDeals = allDeals.filter(
    (d) =>
      d.id !== deal.id &&
      d.lgaIds.some((lgaId) => deal.lgaIds.includes(lgaId)),
  );

  const cardClass = "bg-white border border-[#E8E6E3] p-5 space-y-3";
  const labelClass =
    "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
  const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

  return (
    <aside className="space-y-4" aria-label="Deal context">
      {/* Opportunity Type card */}
      {opportunityType && (
        <div className={cardClass}>
          <p className={labelClass}>Opportunity type</p>
          <p className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]">
            {opportunityType.name}
          </p>
          <p className={bodyClass}>{opportunityType.definition}</p>

          {opportunityType.typicalCapitalStack && (
            <div>
              <p className={labelClass}>Typical capital stack</p>
              <p className={`${bodyClass} mt-1`}>
                {opportunityType.typicalCapitalStack}
              </p>
            </div>
          )}
          {opportunityType.typicalRisks && (
            <div>
              <p className={labelClass}>Typical risks</p>
              <p className={`${bodyClass} mt-1`}>
                {opportunityType.typicalRisks}
              </p>
            </div>
          )}
        </div>
      )}

      {/* LGA Context cards */}
      {dealLgas.map((lga) => (
        <div key={lga.id} className={cardClass}>
          <p className={labelClass}>LGA context</p>
          <p className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]">
            {lga.name}
          </p>
          {lga.summary && (
            <p className={`${bodyClass} line-clamp-4`}>{lga.summary}</p>
          )}
          {lga.repeatedConstraints && lga.repeatedConstraints.length > 0 && (
            <div>
              <p className={labelClass}>Repeated constraints</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {lga.repeatedConstraints.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                  >
                    {CONSTRAINT_LABELS[c]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Related Deals card */}
      {relatedDeals.length > 0 && (
        <div className={cardClass}>
          <p className={labelClass}>Related deals</p>
          <ul className="space-y-2 list-none p-0 m-0">
            {relatedDeals.map((rd) => (
              <li key={rd.id}>
                <Link
                  href={`/deals/${rd.id}`}
                  className="flex items-center gap-2 group text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
                >
                  <span
                    className={`shrink-0 text-[9px] uppercase tracking-wider px-1 py-0.5 ${STAGE_COLOUR_CLASSES[rd.stage]}`}
                  >
                    {STAGE_LABELS[rd.stage]}
                  </span>
                  <span className="truncate">{rd.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
