"use client";

import { useState } from "react";
import { PATHWAY_STAGES } from "@/lib/pathway-data";
import type { PathwayStage } from "@/lib/pathway-data";

/**
 * Deal Pathway — the top pipeline is the sole navigation control.
 * Clicking a stage shows its detail content in the panel below.
 */
export function DealPathway() {
  const [activeStageId, setActiveStageId] = useState<string>(
    PATHWAY_STAGES[0].id,
  );

  const activeStage = PATHWAY_STAGES.find((s) => s.id === activeStageId)!;

  return (
    <div className="max-w-4xl flex flex-col gap-8">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          Deal Development Pathway
        </h1>
        <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed max-w-prose">
          The project development pathway progresses from the establishment of an
          enabling environment and initial concept definition through to detailed
          feasibility, structuring, and final transaction execution. Each stage
          systematically resolves specific technical, commercial, legal, and
          environmental uncertainties, transforming a preliminary concept into a
          bankable asset capable of mobilising private capital and achieving
          financial close.
        </p>
      </div>

      {/* Stage pipeline (sole navigation) + detail panel */}
      <div>
        <StagePipeline
          stages={PATHWAY_STAGES}
          activeStageId={activeStageId}
          onStageClick={setActiveStageId}
        />
        <div
          className="border border-t-0 border-[#E8E6E3] bg-[#FFFFFF] p-5"
          role="tabpanel"
          id={`stage-panel-${activeStage.id}`}
          aria-labelledby={`stage-tab-${activeStage.id}`}
        >
          <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] mb-4">
            Stage {activeStage.number}: {activeStage.title}
          </h2>
          <StageDetail stage={activeStage} />
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

/** Pipeline stepper — sole navigation for stage selection. Uses tablist ARIA pattern. */
function StagePipeline({
  stages,
  activeStageId,
  onStageClick,
}: {
  stages: PathwayStage[];
  activeStageId: string;
  onStageClick: (stageId: string) => void;
}) {
  /** Handle arrow-key navigation within the tablist. */
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % stages.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + stages.length) % stages.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = stages.length - 1;
    } else {
      return;
    }
    onStageClick(stages[nextIndex].id);
    // Move focus to the newly-active tab
    const btn = document.getElementById(`stage-tab-${stages[nextIndex].id}`);
    btn?.focus();
  };

  return (
    <div
      className="border border-[#E8E6E3] bg-[#FFFFFF] p-4"
      role="tablist"
      aria-label="Development pathway stages"
    >
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start justify-between gap-0">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStageId;
          return (
            <div key={stage.id} className="flex items-start flex-1 min-w-0">
              <button
                type="button"
                role="tab"
                id={`stage-tab-${stage.id}`}
                aria-selected={isActive}
                aria-controls={`stage-panel-${stage.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onStageClick(stage.id)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`
                  flex flex-col items-center text-center w-full group
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]
                  transition duration-200 ease-out
                `}
              >
                <div className="flex items-center w-full">
                  {/* Left connector line */}
                  {i > 0 ? (
                    <div className="flex-1 h-px bg-[#E8E6E3]" aria-hidden />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}

                  {/* Stage node */}
                  <div
                    className={`
                      w-9 h-9 shrink-0 flex items-center justify-center
                      border text-sm font-medium transition duration-200 ease-out
                      ${
                        isActive
                          ? "bg-[#2C2C2C] border-[#2C2C2C] text-white"
                          : "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B] group-hover:border-[#2C2C2C] group-hover:text-[#2C2C2C]"
                      }
                    `}
                  >
                    {stage.number}
                  </div>

                  {/* Right connector line */}
                  {i < stages.length - 1 ? (
                    <div className="flex-1 h-px bg-[#E8E6E3]" aria-hidden />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs leading-tight px-1 transition duration-200 ease-out
                    ${isActive ? "text-[#2C2C2C] font-medium" : "text-[#6B6B6B] group-hover:text-[#2C2C2C]"}
                  `}
                >
                  {stage.shortTitle}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="sm:hidden flex flex-col gap-0">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStageId;
          return (
            <div key={stage.id} className="flex items-stretch gap-3">
              {/* Vertical connector + node */}
              <div className="flex flex-col items-center">
                {i > 0 && (
                  <div className="w-px flex-1 bg-[#E8E6E3]" aria-hidden />
                )}
                <button
                  type="button"
                  role="tab"
                  id={`stage-tab-mobile-${stage.id}`}
                  aria-selected={isActive}
                  aria-controls={`stage-panel-${stage.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onStageClick(stage.id)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={`
                    w-8 h-8 shrink-0 flex items-center justify-center
                    border text-sm font-medium
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]
                    transition duration-200 ease-out
                    ${
                      isActive
                        ? "bg-[#2C2C2C] border-[#2C2C2C] text-white"
                        : "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B]"
                    }
                  `}
                >
                  {stage.number}
                </button>
                {i < stages.length - 1 && (
                  <div className="w-px flex-1 bg-[#E8E6E3]" aria-hidden />
                )}
              </div>

              {/* Label */}
              <button
                type="button"
                onClick={() => onStageClick(stage.id)}
                tabIndex={-1}
                className={`
                  py-1.5 text-left bg-transparent border-0
                  focus:outline-none transition duration-200 ease-out
                  ${isActive ? "opacity-100" : "opacity-70 hover:opacity-100"}
                `}
              >
                <p className="text-sm text-[#2C2C2C] font-medium leading-tight">
                  {stage.shortTitle}
                </p>
                <p className="text-xs text-[#6B6B6B] mt-0.5 leading-snug line-clamp-2">
                  {stage.title}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Detailed content for a single pathway stage, shown inside an accordion. */
function StageDetail({ stage }: { stage: PathwayStage }) {
  return (
    <div className="space-y-4">
      {/* Purpose */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Stage Purpose
        </p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          {stage.purpose}
        </p>
      </div>

      {/* Key Activities */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Key Activities
        </p>
        <ul className="list-none p-0 m-0 space-y-2">
          {stage.activities.map((activity) => (
            <li key={activity.name} className="text-sm text-[#2C2C2C] leading-relaxed">
              <span className="font-medium">{activity.name}:</span>{" "}
              {activity.description}
            </li>
          ))}
        </ul>
      </div>

      {/* Stage Gate Checklist */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Stage Gate Checklist
        </p>
        <ul className="list-none p-0 m-0 space-y-2">
          {stage.gateChecklist.map((item) => (
            <li key={item.question} className="text-sm text-[#2C2C2C] leading-relaxed">
              <span className="font-medium">{item.question}:</span>{" "}
              {item.description}
            </li>
          ))}
        </ul>
      </div>

      {/* Primary Risks Addressed */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Primary Risks Addressed
        </p>
        <ul className="list-none p-0 m-0 space-y-2">
          {stage.risksAddressed.map((risk) => (
            <li key={risk.name} className="text-sm text-[#2C2C2C] leading-relaxed">
              <span className="font-medium">{risk.name}:</span>{" "}
              {risk.description}
            </li>
          ))}
        </ul>
      </div>

      {/* Typical Artefacts Produced */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Typical Artefacts Produced
        </p>
        <ul className="list-none p-0 m-0 space-y-1">
          {stage.artefacts.map((artefact) => (
            <li key={artefact} className="text-sm text-[#2C2C2C] leading-relaxed">
              {artefact}
            </li>
          ))}
        </ul>
      </div>

      {/* Investor Readiness */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Investor Readiness
        </p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          {stage.investorAlignment}
        </p>
      </div>

      {/* Evidence */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Evidence
        </p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">
          {stage.evidenceNote}
        </p>
      </div>
    </div>
  );
}
