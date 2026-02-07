"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type {
  SectorDevelopmentStrategy,
  StrategyGrade,
  SectorOpportunity,
  StrategyComponentId,
  GradeLetter,
} from "@/lib/types";
import {
  STRATEGY_COMPONENT_NAMES,
  STRATEGY_COMPONENT_EDDT_DOMAINS,
} from "@/lib/types";
import { AccordionSection } from "@/components/ui/AccordionSection";
import type { StrategyGradeResult } from "@/app/api/strategies/[id]/grade/route";

export interface StrategyDetailProps {
  strategy: SectorDevelopmentStrategy;
  grade: StrategyGrade | null;
  sectorOpportunities: SectorOpportunity[];
}

/** Humanise snake_case strings. */
function humanise(s: string): string {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Grade colour classes using design system semantic colours. */
const GRADE_COLOUR_CLASSES: Record<GradeLetter, string> = {
  A: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "A-": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  B: "bg-blue-50 text-blue-700 border border-blue-200",
  "B-": "bg-blue-50 text-blue-700 border border-blue-200",
  C: "bg-amber-50 text-amber-700 border border-amber-200",
  D: "bg-orange-50 text-orange-700 border border-orange-200",
  F: "bg-red-50 text-red-700 border border-red-200",
};

const COMPONENT_IDS: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];

const cardClass = "bg-white border border-[#E8E6E3] p-5 space-y-3";
const labelClass = "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

/** Progressive disclosure for selection logic within the priority sectors section. */
function SelectionLogicDisclosure({
  selectionLogic,
}: {
  selectionLogic: NonNullable<SectorDevelopmentStrategy["selectionLogic"]>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[#E8E6E3] pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-[#7A6B5A] hover:text-[#5A4B3A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 2l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {open ? "Hide selection logic" : "How were these sectors selected?"}
      </button>

      {open && (
        <div className="space-y-4 mt-3">
          {selectionLogic.adjacentDefinition && (
            <div>
              <p className={labelClass}>Adjacent sector definition</p>
              <p className={`${bodyClass} mt-1`}>
                {selectionLogic.adjacentDefinition}
              </p>
            </div>
          )}
          {selectionLogic.growthDefinition && (
            <div>
              <p className={labelClass}>Growth sector definition</p>
              <p className={`${bodyClass} mt-1`}>
                {selectionLogic.growthDefinition}
              </p>
            </div>
          )}
          {selectionLogic.criteria.length > 0 && (
            <div>
              <p className={labelClass}>Selection criteria</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectionLogic.criteria.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                  >
                    {humanise(c)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StrategyDetail({
  strategy: s,
  grade: initialGrade,
  sectorOpportunities,
}: StrategyDetailProps) {
  // ---------------------------------------------------------------------------
  // State for grading
  // ---------------------------------------------------------------------------
  const [grade, setGrade] = useState<StrategyGrade | null>(initialGrade);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeWarnings, setGradeWarnings] = useState<string[]>([]);
  const [gradeDetailOpen, setGradeDetailOpen] = useState(false);

  // Build sector opportunity lookup for linked items
  const soById = new Map<string, SectorOpportunity>();
  for (const so of sectorOpportunities) {
    soById.set(so.id, so);
  }

  const prioritySectors = s.prioritySectorIds
    .map((id) => soById.get(id))
    .filter(Boolean) as SectorOpportunity[];

  // ---------------------------------------------------------------------------
  // Grade handler
  // ---------------------------------------------------------------------------
  const hasContent = COMPONENT_IDS.some(
    (cid) => s.components[cid]?.trim(),
  );

  const handleGrade = useCallback(async () => {
    setIsGrading(true);
    setGradeError(null);

    try {
      const res = await fetch(`/api/strategies/${s.id}/grade`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            `Grading failed (${res.status})`,
        );
      }

      const result = (await res.json()) as StrategyGradeResult;
      setGrade(result);
      setGradeWarnings(result.warnings ?? []);
    } catch (err) {
      setGradeError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsGrading(false);
    }
  }, [s.id]);

  return (
    <div className="flex flex-col gap-6" data-testid="strategy-detail">
      {/* Back link + edit */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/lga/strategies"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          ← All strategies
        </Link>
        <Link
          href={`/lga/strategies/${s.id}/draft`}
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
          data-testid="edit-strategy-link"
        >
          Edit strategy
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-0">
          {/* Hero card — Strategy metadata */}
          <section
            className="bg-white border border-[#E8E6E3] p-6 space-y-5"
            aria-label="Strategy overview"
          >
            <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
              {s.title}
            </h1>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]">
                {humanise(s.type)}
              </span>
              {s.status === "draft" && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                  Draft
                </span>
              )}
              {grade && (
                <span
                  className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${GRADE_COLOUR_CLASSES[grade.gradeLetter]}`}
                >
                  Grade {grade.gradeLetter}
                </span>
              )}
            </div>

            {/* Meta line */}
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {s.sourceDocument
                ? `Source: ${s.sourceDocument}`
                : "No source document"}
              {` · ${prioritySectors.length} priority sectors`}
            </p>

            <div className="border-t border-[#E8E6E3]" />

            {/* Summary */}
            <div className="space-y-2">
              {s.summary.split("\n\n").map((para, i) => (
                <p key={i} className={bodyClass}>
                  {para}
                </p>
              ))}
            </div>
          </section>

          {/* AI Grading trigger */}
          {!grade && hasContent && (
            <section className="bg-[#F5F3F0] border border-t-0 border-[#E8E6E3] px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass}>Strategy grading</p>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mt-1">
                    No grade assigned yet. Run the AI grader to evaluate this
                    strategy against the six-component blueprint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGrade}
                  disabled={isGrading}
                  className="shrink-0 px-4 py-2 text-sm bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out disabled:opacity-50"
                  data-testid="run-grading-btn"
                >
                  {isGrading ? "Grading…" : "Run AI grading"}
                </button>
              </div>
              {isGrading && (
                <div
                  className="flex items-center gap-3 mt-3"
                  role="status"
                >
                  <svg
                    className="h-5 w-5 animate-spin text-[#7A6B5A]"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      className="opacity-75"
                    />
                  </svg>
                  <p className="text-sm text-[#2C2C2C]">
                    Evaluating strategy against the blueprint…
                  </p>
                </div>
              )}
              {gradeError && (
                <div
                  className="mt-3 bg-red-50 border border-red-200 px-4 py-3 space-y-2"
                  role="alert"
                >
                  <p className="text-sm text-red-800">{gradeError}</p>
                  <button
                    type="button"
                    onClick={handleGrade}
                    className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900"
                  >
                    Retry grading
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Re-grade handled in sidebar grade card */}

          {/* Accordion sections */}
          <div className="bg-white border border-t-0 border-[#E8E6E3] px-6">
            {/* Priority sectors with nested selection logic */}
            <AccordionSection
              title="Priority sectors"
              badge={String(prioritySectors.length)}
              defaultOpen
            >
              <div className="space-y-4">
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Sectors identified by this strategy as adjacent or growth
                  opportunities for the region.
                </p>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  data-testid="priority-sectors"
                >
                  {prioritySectors.map((so) => (
                    <Link
                      key={so.id}
                      href={`/sectors/${so.id}`}
                      className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1.5 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <p className="text-sm font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out">
                        {so.name}
                      </p>
                      {so.sections["1"] && (
                        <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">
                          {so.sections["1"]}
                        </p>
                      )}
                      {so.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {so.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] uppercase tracking-wider px-1 py-0.5 bg-white text-[#6B6B6B] border border-[#E8E6E3]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
                {prioritySectors.length === 0 && (
                  <p className="text-sm text-[#6B6B6B]">No priority sectors linked.</p>
                )}

                {/* Selection logic — progressive disclosure */}
                {s.selectionLogic && (
                  <SelectionLogicDisclosure selectionLogic={s.selectionLogic} />
                )}
              </div>
            </AccordionSection>

            {/* Blueprint components — each as its own accordion */}
            {COMPONENT_IDS.map((cid) => {
              const content = s.components[cid];
              if (!content) return null;
              const domains = STRATEGY_COMPONENT_EDDT_DOMAINS[cid];
              return (
                <AccordionSection
                  key={cid}
                  title={`${cid}. ${STRATEGY_COMPONENT_NAMES[cid]}`}
                  badge={domains.join(" · ")}
                  defaultOpen={cid === "1"}
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

            {/* Grade and evidence — rendered in sidebar instead */}
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Strategy context">
          {/* Grade card */}
          {grade ? (
            <div className={cardClass} data-testid="sidebar-grade-card">
              <p className={labelClass}>Strategy grade</p>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                AI assessment against the six-component blueprint for sector
                development strategies.
              </p>

              {/* Grading warnings */}
              {gradeWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 px-3 py-2 space-y-1">
                  <p className="text-[10px] font-medium text-amber-800">
                    {gradeWarnings.length}{" "}
                    {gradeWarnings.length === 1 ? "warning" : "warnings"}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {gradeWarnings.map((w, i) => (
                      <li key={i} className="text-[10px] text-amber-700">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grade letter + rationale (always visible) */}
              <div className="flex items-start gap-3 border-t border-[#E8E6E3] pt-3">
                <div
                  className={`flex items-center justify-center w-12 h-12 text-lg font-heading font-medium shrink-0 ${GRADE_COLOUR_CLASSES[grade.gradeLetter]}`}
                >
                  {grade.gradeLetter}
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={labelClass}>Rationale</p>
                  <p className={bodyClass}>{grade.gradeRationaleShort}</p>
                </div>
              </div>

              {/* Disclosure toggle */}
              <button
                type="button"
                onClick={() => setGradeDetailOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[#7A6B5A] hover:text-[#5A4B3A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2"
                aria-expanded={gradeDetailOpen}
                data-testid="grade-detail-toggle"
              >
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${gradeDetailOpen ? "rotate-90" : ""}`}
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 2l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {gradeDetailOpen ? "Hide detail" : "Show detail"}
              </button>

              {/* Collapsible detail section */}
              {gradeDetailOpen && (
                <div className="space-y-3">
                  {/* Scope discipline */}
                  {grade.scopeDisciplineNotes && (
                    <div className="border-t border-[#E8E6E3] pt-3">
                      <p className={labelClass}>Scope discipline</p>
                      <p className={`${bodyClass} mt-1`}>
                        {grade.scopeDisciplineNotes}
                      </p>
                    </div>
                  )}

                  {/* Evidence by component */}
                  <div className="border-t border-[#E8E6E3] pt-3">
                    <p className={`${labelClass} mb-2`}>Evidence by component</p>
                    <div className="space-y-2">
                      {COMPONENT_IDS.map((cid) => {
                        const note = grade.evidenceNotesByComponent[cid];
                        if (!note) return null;
                        return (
                          <div key={cid}>
                            <p className="text-[10px] font-medium text-[#2C2C2C]">
                              {cid}. {STRATEGY_COMPONENT_NAMES[cid]}
                            </p>
                            <p className="text-xs text-[#6B6B6B] leading-relaxed mt-0.5">
                              {note}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Missing elements */}
                  {grade.missingElements.length > 0 && (
                    <div className="border-t border-[#E8E6E3] pt-3">
                      <p className={`${labelClass} mb-2`}>Missing elements</p>
                      <ul className="space-y-1 list-none p-0 m-0">
                        {grade.missingElements.map((me, i) => (
                          <li key={i} className="text-xs text-[#6B6B6B] leading-relaxed">
                            <span className="font-medium text-[#2C2C2C]">
                              Component {me.componentId}:
                            </span>{" "}
                            {me.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Re-grade */}
              {hasContent && (
                <div className="border-t border-[#E8E6E3] pt-3">
                  <button
                    type="button"
                    onClick={handleGrade}
                    disabled={isGrading}
                    className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] disabled:opacity-50"
                    data-testid="regrade-btn"
                  >
                    {isGrading ? "Re-grading…" : "Re-grade strategy"}
                  </button>
                </div>
              )}
            </div>
          ) : hasContent ? (
            <div className={cardClass} data-testid="sidebar-grade-prompt">
              <p className={labelClass}>Strategy grade</p>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                AI assessment against the six-component blueprint. Not yet graded.
              </p>
              <button
                type="button"
                onClick={handleGrade}
                disabled={isGrading}
                className="w-full px-3 py-2 text-sm bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out disabled:opacity-50"
                data-testid="sidebar-run-grading-btn"
              >
                {isGrading ? "Grading…" : "Run AI grading"}
              </button>
            </div>
          ) : null}

          {/* Priority sectors moved to left panel */}

          {/* EDDT visual */}
          <div className={cardClass}>
            <p className={labelClass}>Economic Development Design Tool</p>
            <Image
              src="/images/eddt.png"
              alt="Economic Development and Design Tool visual showing the domains: Market, Capital, Support Services, Businesses, Infrastructure, Policy, and Culture"
              width={400}
              height={300}
              className="w-full h-auto"
            />
          </div>

          {/* Source document card */}
          {s.sourceDocument && (
            <div className={cardClass}>
              <p className={labelClass}>Source document</p>
              <p className={bodyClass}>{s.sourceDocument}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
