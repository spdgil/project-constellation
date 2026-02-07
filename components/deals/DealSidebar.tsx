import Link from "next/link";
import type { Deal, LGA, OpportunityType, SectorOpportunity } from "@/lib/types";
import { STAGE_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES } from "@/lib/stage-colours";
import {
  COLOUR_CLASSES,
  OPP_TYPE_COLOUR,
  OPP_TYPE_TO_SECTOR,
  formatAUD,
} from "@/lib/colour-system";

export interface DealSidebarProps {
  deal: Deal;
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
  /** All deals, used to derive "related deals" (same LGA). */
  allDeals: Deal[];
  sectorOpportunities: SectorOpportunity[];
}

const cardClass = "bg-white border border-[#E8E6E3] p-5 space-y-3";
const labelClass =
  "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

/**
 * Contextual sidebar for the full-page deal detail.
 * - Linked sector opportunity card (emerald accent)
 * - Opportunity Type card (colour from OPP_TYPE_COLOUR)
 * - LGA Context cards (violet accent, clickable to map view)
 * - Related Deals card (blue accent, clickable card format)
 */
export function DealSidebar({
  deal,
  opportunityTypes,
  lgas,
  allDeals,
  sectorOpportunities,
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

  // Linked sector opportunity
  const sectorId = OPP_TYPE_TO_SECTOR[deal.opportunityTypeId];
  const linkedSector = sectorId
    ? sectorOpportunities.find((s) => s.id === sectorId)
    : undefined;

  const oppColour = OPP_TYPE_COLOUR[deal.opportunityTypeId] ?? "blue";
  const oppC = COLOUR_CLASSES[oppColour];

  return (
    <aside className="space-y-4" aria-label="Deal context">
      {/* ---- Sector & opportunity type (combined) ---- */}
      {opportunityType && (
        <div className={`${cardClass} border-l-[3px] ${oppC.borderLeft}`}>
          {/* Sector opportunity — clickable link to sector detail */}
          {linkedSector && (
            <>
              <p className={labelClass}>Sector opportunity</p>
              <Link
                href={`/sectors/${linkedSector.id}`}
                className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1.5 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
                  {linkedSector.name}
                </p>
                {linkedSector.sections["1"] && (
                  <p className="text-[10px] text-[#6B6B6B] leading-relaxed line-clamp-2">
                    {linkedSector.sections["1"].split("\n\n")[0]?.slice(0, 120)}…
                  </p>
                )}
              </Link>
              <div className="border-t border-[#E8E6E3]" />
            </>
          )}

          {/* Opportunity type details */}
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

      {/* ---- LGA Context cards (violet accent, clickable) ---- */}
      {dealLgas.length > 0 && (
        <div className={`${cardClass} border-l-[3px] border-l-violet-400`}>
          <p className={labelClass}>
            Local Government Areas
            {dealLgas.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                {dealLgas.length}
              </span>
            )}
          </p>
          <div className="space-y-2">
            {dealLgas.map((lga) => (
              <Link
                key={lga.id}
                href={`/?tab=map&lga=${lga.id}`}
                className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1.5 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out">
                  {lga.name}
                </p>
                {lga.summary && (
                  <p className="text-[10px] text-[#6B6B6B] leading-relaxed line-clamp-2">
                    {lga.summary}
                  </p>
                )}
                {lga.repeatedConstraints && lga.repeatedConstraints.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lga.repeatedConstraints.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] uppercase tracking-wider px-1 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                      >
                        {CONSTRAINT_LABELS[c]}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-[#9A9A9A] mt-0.5">View on map</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---- Related Deals (blue accent, clickable cards) ---- */}
      {relatedDeals.length > 0 && (
        <div className={`${cardClass} border-l-[3px] border-l-blue-400`}>
          <p className={labelClass}>
            Related deals
            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {relatedDeals.length}
            </span>
          </p>
          <div className="space-y-2">
            {relatedDeals.map((rd) => (
              <Link
                key={rd.id}
                href={`/deals/${rd.id}`}
                className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1.5 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
                  {rd.name}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-[#6B6B6B]">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1 py-0.5 ${STAGE_COLOUR_CLASSES[rd.stage]}`}
                  >
                    {STAGE_LABELS[rd.stage]}
                  </span>
                  {rd.investmentValueAmount > 0 && (
                    <span className="font-medium text-amber-700">
                      {formatAUD(rd.investmentValueAmount)}
                    </span>
                  )}
                  {(rd.economicImpactJobs ?? 0) > 0 && (
                    <span>{rd.economicImpactJobs!.toLocaleString()} jobs</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
