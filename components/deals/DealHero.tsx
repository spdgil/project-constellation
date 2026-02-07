import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { STAGE_LABELS, READINESS_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import {
  STAGE_COLOUR_CLASSES,
  READINESS_COLOUR_CLASSES,
} from "@/lib/stage-colours";
import { formatDate } from "@/lib/format";

export interface DealHeroProps {
  deal: Deal;
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
}

/**
 * Hero card for the full-page deal detail.
 * Dense field grid with deal name (Newsreader h1), badges, summary, key metadata.
 */
export function DealHero({ deal, opportunityTypes, lgas }: DealHeroProps) {
  const opportunityTypeName =
    opportunityTypes.find((o) => o.id === deal.opportunityTypeId)?.name ??
    deal.opportunityTypeId;
  const lgaNames = deal.lgaIds
    .map((id) => lgas.find((l) => l.id === id)?.name ?? id)
    .join(", ");

  return (
    <section
      className="bg-white border border-[#E8E6E3] p-6 space-y-5"
      aria-label="Deal overview"
    >
      {/* Name */}
      <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
        {deal.name}
      </h1>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[deal.stage]}`}
        >
          {STAGE_LABELS[deal.stage]}
        </span>
        <span
          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${READINESS_COLOUR_CLASSES[deal.readinessState]}`}
        >
          {READINESS_LABELS[deal.readinessState]}
        </span>
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]">
          {CONSTRAINT_LABELS[deal.dominantConstraint]}
        </span>
      </div>

      {/* Meta line */}
      <p className="text-xs text-[#6B6B6B] leading-relaxed">
        {opportunityTypeName}
        {lgaNames ? ` · ${lgaNames}` : ""}
        {` · Updated ${formatDate(deal.updatedAt)}`}
      </p>

      {/* Divider */}
      <div className="border-t border-[#E8E6E3]" />

      {/* Summary */}
      {deal.description ? (
        <div className="space-y-2">
          {deal.description.split("\n\n").map((para, i) => (
            <p
              key={i}
              className="text-sm text-[#2C2C2C] leading-relaxed"
            >
              {para}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          {deal.summary}
        </p>
      )}

      {/* Next step */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Next step
        </p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          {deal.nextStep}
        </p>
      </div>

      {/* Dense field grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {(deal.investmentValueAmount > 0 || deal.investmentValueDescription) && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Investment value
            </p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">
              {deal.investmentValueAmount > 0
                ? `AUD $${(deal.investmentValueAmount / 1_000_000).toFixed(1)}M`
                : ""}
              {deal.investmentValueAmount > 0 && deal.investmentValueDescription ? " — " : ""}
              {deal.investmentValueDescription}
            </p>
          </div>
        )}
        {(deal.economicImpactAmount > 0 || deal.economicImpactDescription) && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Economic impact
            </p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">
              {deal.economicImpactAmount > 0
                ? `AUD $${(deal.economicImpactAmount / 1_000_000).toFixed(1)}M GDP`
                : ""}
              {deal.economicImpactAmount > 0 && deal.economicImpactDescription ? " — " : ""}
              {deal.economicImpactDescription}
              {deal.economicImpactJobs != null && deal.economicImpactJobs > 0 && (
                <span className="ml-1 text-[#6B6B6B]">
                  ({deal.economicImpactJobs.toLocaleString()} jobs)
                </span>
              )}
            </p>
          </div>
        )}
        {deal.keyStakeholders && deal.keyStakeholders.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Key stakeholders
            </p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">
              {deal.keyStakeholders.join(", ")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
