"use client";

import type { Deal, LGA, OpportunityType } from "@/lib/types";
import { STAGE_LABELS, READINESS_LABELS, CONSTRAINT_LABELS } from "@/lib/labels";
import {
  STAGE_COLOUR_CLASSES,
  READINESS_COLOUR_CLASSES,
} from "@/lib/stage-colours";
import { formatDate } from "@/lib/format";
import {
  COLOUR_CLASSES,
  OPP_TYPE_COLOUR,
  formatAUD,
} from "@/lib/colour-system";

export interface DealHeroProps {
  deal: Deal;
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
  isEditing: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onOptimisticUpdate: (patch: Partial<Deal>) => void;
}

const metricInputClass =
  "w-full h-8 px-2 border border-[#E8E6E3] bg-white text-sm text-[#2C2C2C] placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out";

/**
 * Hero card for the full-page deal detail.
 * Coloured top border by opportunity-type colour family.
 * Financial metrics (Investment, Economic Impact, Jobs) sit prominently
 * under the title — always visible, editable in edit mode.
 */
export function DealHero({
  deal,
  opportunityTypes,
  lgas,
  isEditing,
  onSave,
  onOptimisticUpdate,
}: DealHeroProps) {
  const opportunityTypeName =
    opportunityTypes.find((o) => o.id === deal.opportunityTypeId)?.name ??
    deal.opportunityTypeId;
  const lgaNames = deal.lgaIds
    .map((id) => lgas.find((l) => l.id === id)?.name ?? id)
    .join(", ");

  const colour = OPP_TYPE_COLOUR[deal.opportunityTypeId] ?? "blue";
  const c = COLOUR_CLASSES[colour];
  const amberC = COLOUR_CLASSES.amber;
  const emeraldC = COLOUR_CLASSES.emerald;

  /* ---------- Edit handlers ---------- */

  const handleAmountBlur = (
    field: "investmentValueAmount" | "economicImpactAmount",
    raw: string,
  ) => {
    const parsed = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    onOptimisticUpdate({ [field]: parsed });
    onSave({ [field]: parsed });
  };

  const handleDescBlur = (
    field: "investmentValueDescription" | "economicImpactDescription",
    value: string,
  ) => {
    onOptimisticUpdate({ [field]: value });
    onSave({ [field]: value });
  };

  const handleJobsBlur = (raw: string) => {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
    onOptimisticUpdate({ economicImpactJobs: parsed });
    onSave({ economicImpactJobs: parsed });
  };

  return (
    <section
      className={`bg-white border border-[#E8E6E3] border-t-[3px] ${c.borderTop} p-6 space-y-5`}
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

      {/* ------------------------------------------------------------------ */}
      {/* Financial metrics — always visible, editable in edit mode           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-3 gap-3" data-testid="deal-financials">
        {/* Investment */}
        <div
          className={`border border-[#E8E6E3] border-l-[3px] ${amberC.borderLeft} px-4 py-3 space-y-1`}
        >
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
            Investment
          </p>
          {isEditing ? (
            <div className="space-y-1">
              <input
                type="text"
                aria-label="Investment amount"
                defaultValue={deal.investmentValueAmount > 0 ? String(deal.investmentValueAmount) : ""}
                placeholder="Amount (e.g. 5000000)"
                className={metricInputClass}
                onBlur={(e) => handleAmountBlur("investmentValueAmount", e.target.value)}
              />
              <input
                type="text"
                aria-label="Investment description"
                defaultValue={deal.investmentValueDescription ?? ""}
                placeholder="Description…"
                className={`${metricInputClass} text-xs`}
                onBlur={(e) => handleDescBlur("investmentValueDescription", e.target.value)}
              />
            </div>
          ) : (
            <>
              <p className={`text-lg font-heading font-normal ${amberC.text}`}>
                {deal.investmentValueAmount > 0 ? formatAUD(deal.investmentValueAmount) : "—"}
              </p>
              {deal.investmentValueDescription && (
                <p className="text-[11px] text-[#6B6B6B] leading-snug">
                  {deal.investmentValueDescription}
                </p>
              )}
            </>
          )}
        </div>

        {/* Economic impact */}
        <div
          className={`border border-[#E8E6E3] border-l-[3px] ${emeraldC.borderLeft} px-4 py-3 space-y-1`}
        >
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
            Economic impact
          </p>
          {isEditing ? (
            <div className="space-y-1">
              <input
                type="text"
                aria-label="Economic impact amount"
                defaultValue={deal.economicImpactAmount > 0 ? String(deal.economicImpactAmount) : ""}
                placeholder="Amount (e.g. 3000000000)"
                className={metricInputClass}
                onBlur={(e) => handleAmountBlur("economicImpactAmount", e.target.value)}
              />
              <input
                type="text"
                aria-label="Economic impact description"
                defaultValue={deal.economicImpactDescription ?? ""}
                placeholder="Description…"
                className={`${metricInputClass} text-xs`}
                onBlur={(e) => handleDescBlur("economicImpactDescription", e.target.value)}
              />
            </div>
          ) : (
            <>
              <p className={`text-lg font-heading font-normal ${emeraldC.text}`}>
                {deal.economicImpactAmount > 0 ? formatAUD(deal.economicImpactAmount) : "—"}
              </p>
              {deal.economicImpactDescription && (
                <p className="text-[11px] text-[#6B6B6B] leading-snug">
                  {deal.economicImpactDescription}
                </p>
              )}
            </>
          )}
        </div>

        {/* Jobs */}
        <div
          className={`border border-[#E8E6E3] border-l-[3px] ${emeraldC.borderLeft} px-4 py-3 space-y-1`}
        >
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
            Jobs
          </p>
          {isEditing ? (
            <input
              type="text"
              aria-label="Jobs count"
              defaultValue={(deal.economicImpactJobs ?? 0) > 0 ? String(deal.economicImpactJobs) : ""}
              placeholder="Number of jobs"
              className={metricInputClass}
              onBlur={(e) => handleJobsBlur(e.target.value)}
            />
          ) : (
            <p className={`text-lg font-heading font-normal ${emeraldC.text}`}>
              {(deal.economicImpactJobs ?? 0) > 0 ? deal.economicImpactJobs!.toLocaleString() : "—"}
            </p>
          )}
        </div>
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

      {/* Key stakeholders */}
      {deal.keyStakeholders && deal.keyStakeholders.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
            Key stakeholders
          </p>
          <p className="text-sm text-[#2C2C2C] leading-relaxed">
            {deal.keyStakeholders.join(", ")}
          </p>
        </div>
      )}
    </section>
  );
}
