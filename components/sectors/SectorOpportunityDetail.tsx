"use client";

import Link from "next/link";
import type {
  SectorOpportunity,
  SectorOpportunitySectionId,
  SectorDevelopmentStrategy,
  Deal,
  LGA,
} from "@/lib/types";
import { SECTOR_OPPORTUNITY_SECTION_NAMES } from "@/lib/types";
import { AccordionSection } from "@/components/ui/AccordionSection";
import {
  type ColourFamily,
  COLOUR_CLASSES,
  SECTOR_COLOUR,
  TAG_COLOUR,
  formatAUD,
  humaniseTag,
} from "@/lib/colour-system";

/* -------------------------------------------------------------------------- */
/* Types & props                                                               */
/* -------------------------------------------------------------------------- */

export interface SectorOpportunityDetailProps {
  sectorOpportunity: SectorOpportunity;
  linkedStrategies: SectorDevelopmentStrategy[];
  linkedDeals: Deal[];
  linkedLgas: LGA[];
}

/** Section number → colour theme for subtle differentiation. */
const SECTION_THEME: Record<string, ColourFamily> = {
  "2": "emerald",  // Structural Drivers
  "3": "blue",     // Economic Role
  "4": "amber",    // Value Chain
  "5": "violet",   // Capability Requirements
  "6": "amber",    // Constraints
  "7": "blue",     // Workforce
  "8": "emerald",  // Enabling Conditions
  "9": "violet",   // Maturity
  "10": "emerald", // Strategic Implications
};

const SECTION_IDS: SectorOpportunitySectionId[] = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
];

const cardClass = "bg-white border border-[#E8E6E3] p-5 space-y-3";
const labelClass =
  "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function SectorOpportunityDetail({
  sectorOpportunity: so,
  linkedStrategies,
  linkedDeals,
  linkedLgas,
}: SectorOpportunityDetailProps) {
  const colour = SECTOR_COLOUR[so.id] ?? "blue";
  const c = COLOUR_CLASSES[colour];

  // Aggregate deal stats
  const totalInvestment = linkedDeals.reduce(
    (sum, d) => sum + (d.investmentValueAmount ?? 0),
    0,
  );
  const totalImpact = linkedDeals.reduce(
    (sum, d) => sum + (d.economicImpactAmount ?? 0),
    0,
  );
  const totalJobs = linkedDeals.reduce(
    (sum, d) => sum + (d.economicImpactJobs ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6" data-testid="sector-detail">
      {/* Back link + edit button */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/sectors"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          ← All sector opportunities
        </Link>
        <Link
          href={`/sectors/${so.id}/edit`}
          className="px-3 py-1 text-sm font-medium text-[#7A6B5A] border border-[#7A6B5A] hover:bg-[#7A6B5A] hover:text-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
          data-testid="edit-sector-link"
        >
          Edit sector
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary stats bar                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Deals" value={linkedDeals.length > 0 ? String(linkedDeals.length) : "—"} colour="blue" />
        <StatCard label="Investment" value={totalInvestment > 0 ? formatAUD(totalInvestment) : "—"} colour="amber" />
        <StatCard label="Economic impact" value={totalImpact > 0 ? formatAUD(totalImpact) : "—"} colour="emerald" />
        <StatCard label="Jobs identified" value={totalJobs > 0 ? totalJobs.toLocaleString() : "—"} colour="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================================================================ */}
        {/* Main content — 2/3                                                */}
        {/* ================================================================ */}
        <div className="lg:col-span-2 flex flex-col gap-0">
          {/* Hero card with coloured top border */}
          <section
            className={`bg-white border border-[#E8E6E3] border-t-[3px] ${c.borderTop} p-6 space-y-5`}
            aria-label="Sector opportunity overview"
          >
            <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
              {so.name}
            </h1>

            {/* Tags — colour-coded */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {so.tags.map((tag) => {
                const tc = TAG_COLOUR[tag];
                const cls = tc ? COLOUR_CLASSES[tc] : null;
                return (
                  <span
                    key={tag}
                    className={
                      cls
                        ? `text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${cls.tagBg} ${cls.tagText} border ${cls.tagBorder}`
                        : "text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                    }
                  >
                    {humaniseTag(tag)}
                  </span>
                );
              })}
            </div>

            {/* Meta */}
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Version {so.version}
            </p>

            <div className="border-t border-[#E8E6E3]" />

            {/* Section 1 — always visible */}
            <div>
              <p className={labelClass}>
                {SECTOR_OPPORTUNITY_SECTION_NAMES["1"]}
              </p>
              <div className="mt-1 space-y-2">
                {so.sections["1"].split("\n\n").map((para, i) => (
                  <p key={i} className={bodyClass}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* Sections 2–10 as accordions with coloured number badges */}
          <div className="bg-white border border-t-0 border-[#E8E6E3] px-6">
            {SECTION_IDS.slice(1).map((sectionId) => {
              const content = so.sections[sectionId];
              if (!content) return null;

              const sTheme = SECTION_THEME[sectionId] ?? "blue";
              const sc = COLOUR_CLASSES[sTheme];

              return (
                <AccordionSection
                  key={sectionId}
                  title={SECTOR_OPPORTUNITY_SECTION_NAMES[sectionId]}
                  badge={
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium ${sc.tagBg} ${sc.tagText} border ${sc.tagBorder}`}
                    >
                      {sectionId}
                    </span>
                  }
                  defaultOpen={sectionId === "2"}
                >
                  <div className="space-y-2">
                    {content.split("\n\n").map((para, i) => (
                      <p key={i} className={bodyClass}>
                        {para}
                      </p>
                    ))}
                  </div>
                </AccordionSection>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* Sidebar — 1/3                                                     */}
        {/* ================================================================ */}
        <aside
          className="space-y-4 lg:sticky lg:top-6 lg:self-start"
          aria-label="Sector context"
        >
          {/* ---- Associated deals ---- */}
          <div className={`${cardClass} border-l-[3px] border-l-blue-400`}>
            <p className={labelClass}>
              Associated deals
              {linkedDeals.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {linkedDeals.length}
                </span>
              )}
            </p>
            {linkedDeals.length === 0 ? (
              <p className="text-xs text-[#9A9A9A]">No deals in this sector yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1.5 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
                      {deal.name}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[#6B6B6B]">
                      {deal.investmentValueAmount > 0 && (
                        <span className="font-medium text-amber-700">
                          {formatAUD(deal.investmentValueAmount)}
                        </span>
                      )}
                      {(deal.economicImpactJobs ?? 0) > 0 && (
                        <span>
                          {deal.economicImpactJobs!.toLocaleString()} jobs
                        </span>
                      )}
                      <span className="capitalize">
                        {deal.stage.replace(/-/g, " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ---- LGAs ---- */}
          <div className={`${cardClass} border-l-[3px] border-l-violet-400`}>
            <p className={labelClass}>
              Local Government Areas
              {linkedLgas.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                  {linkedLgas.length}
                </span>
              )}
            </p>
            {linkedLgas.length === 0 ? (
              <p className="text-xs text-[#9A9A9A]">No LGAs associated yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedLgas.map((lga) => (
                  <Link
                    key={lga.id}
                    href={`/?tab=map&lga=${lga.id}`}
                    className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out">
                      {lga.name}
                    </p>
                    <p className="text-[10px] text-[#9A9A9A] mt-0.5">View on map</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ---- Linked strategies ---- */}
          {linkedStrategies.length > 0 && (
            <div className={`${cardClass} border-l-[3px] border-l-emerald-400`}>
              <p className={labelClass}>
                Referenced by strategies
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {linkedStrategies.length}
                </span>
              </p>
              <div className="space-y-2">
                {linkedStrategies.map((s) => (
                  <Link
                    key={s.id}
                    href={`/strategies/${s.id}`}
                    className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
                      {s.title}
                    </p>
                    {s.summary && (
                      <p className="text-[10px] text-[#6B6B6B] leading-relaxed line-clamp-2">
                        {s.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: string;
  colour: ColourFamily;
}) {
  const c = COLOUR_CLASSES[colour];
  return (
    <div
      className={`bg-white border border-[#E8E6E3] border-l-[3px] ${c.borderLeft} px-4 py-3 space-y-0.5`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
        {label}
      </p>
      <p className={`text-lg font-heading font-normal ${c.text}`}>{value}</p>
    </div>
  );
}
