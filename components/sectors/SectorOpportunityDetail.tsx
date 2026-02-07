"use client";

import Link from "next/link";
import type {
  SectorOpportunity,
  SectorOpportunitySectionId,
  SectorDevelopmentStrategy,
} from "@/lib/types";
import { SECTOR_OPPORTUNITY_SECTION_NAMES } from "@/lib/types";
import { AccordionSection } from "@/components/ui/AccordionSection";

export interface SectorOpportunityDetailProps {
  sectorOpportunity: SectorOpportunity;
  linkedStrategies: SectorDevelopmentStrategy[];
}

/** Humanise a snake_case tag. */
function humaniseTag(tag: string): string {
  return tag.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const SECTION_IDS: SectorOpportunitySectionId[] = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
];

const cardClass = "bg-white border border-[#E8E6E3] p-5 space-y-3";
const labelClass = "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

export function SectorOpportunityDetail({
  sectorOpportunity: so,
  linkedStrategies,
}: SectorOpportunityDetailProps) {
  return (
    <div className="flex flex-col gap-6" data-testid="sector-detail">
      {/* Back link */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/sectors"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          ← All sector opportunities
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-0">
          {/* Hero card */}
          <section
            className="bg-white border border-[#E8E6E3] p-6 space-y-5"
            aria-label="Sector opportunity overview"
          >
            <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
              {so.name}
            </h1>

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {so.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                >
                  {humaniseTag(tag)}
                </span>
              ))}
            </div>

            {/* Meta */}
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Version {so.version}
              {so.sources.length > 0 && ` · Source: ${so.sources.join(", ")}`}
            </p>

            <div className="border-t border-[#E8E6E3]" />

            {/* Section 1 — always visible as summary */}
            <div>
              <p className={labelClass}>
                {SECTOR_OPPORTUNITY_SECTION_NAMES["1"]}
              </p>
              <p className={`${bodyClass} mt-1`}>{so.sections["1"]}</p>
            </div>
          </section>

          {/* Sections 2–10 as accordions */}
          <div className="bg-white border border-t-0 border-[#E8E6E3] px-6">
            {SECTION_IDS.slice(1).map((sectionId) => {
              const content = so.sections[sectionId];
              if (!content) return null;

              return (
                <AccordionSection
                  key={sectionId}
                  title={`${sectionId}. ${SECTOR_OPPORTUNITY_SECTION_NAMES[sectionId]}`}
                  defaultOpen={false}
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

        {/* Sidebar — 1/3 */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Sector context">
          {/* Linked strategies card */}
          {linkedStrategies.length > 0 && (
            <div className={cardClass}>
              <p className={labelClass}>Referenced by strategies</p>
              <ul className="space-y-2 list-none p-0 m-0">
                {linkedStrategies.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/strategies/${s.id}`}
                      className="flex items-center gap-2 group text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
                    >
                      <span className="truncate">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags card */}
          {so.tags.length > 0 && (
            <div className={cardClass}>
              <p className={labelClass}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {so.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                  >
                    {humaniseTag(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources card */}
          {so.sources.length > 0 && (
            <div className={cardClass}>
              <p className={labelClass}>Sources</p>
              <ul className="space-y-1 list-none p-0 m-0">
                {so.sources.map((src) => (
                  <li key={src} className={bodyClass}>
                    {src.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
