import type { DealStage } from "@/lib/types";
import { PATHWAY_STAGES } from "@/lib/pathway-data";
import { STAGE_NODE_CLASSES } from "@/lib/stage-colours";

export interface DealPathwayStepperProps {
  activeStageId: DealStage;
}

/**
 * Read-only Deal Pathway stepper that visually highlights the current deal's
 * stage within the 5-stage pipeline. Same visual treatment as the interactive
 * StagePipeline in DealPathway.tsx but without click handlers or tab semantics.
 */
export function DealPathwayStepper({ activeStageId }: DealPathwayStepperProps) {
  const stages = PATHWAY_STAGES;

  return (
    <div
      className="border border-[#E8E6E3] bg-[#FFFFFF] p-4"
      role="img"
      aria-label={`Deal pathway — current stage: ${stages.find((s) => s.id === activeStageId)?.shortTitle ?? activeStageId}`}
      data-testid="deal-pathway-stepper"
    >
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start justify-between gap-0">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStageId;
          return (
            <div key={stage.id} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center text-center w-full">
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
                          ? STAGE_NODE_CLASSES[stage.id].active
                          : STAGE_NODE_CLASSES[stage.id].inactive
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
                    ${isActive ? "text-[#2C2C2C] font-medium" : "text-[#6B6B6B]"}
                  `}
                >
                  {stage.shortTitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: horizontal compact (no vertical layout needed for read-only) */}
      <div className="sm:hidden flex items-center justify-between gap-0">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStageId;
          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center text-center w-full">
                <div className="flex items-center w-full">
                  {i > 0 ? (
                    <div className="flex-1 h-px bg-[#E8E6E3]" aria-hidden />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                  <div
                    className={`
                      w-7 h-7 shrink-0 flex items-center justify-center
                      border text-xs font-medium
                      ${
                        isActive
                          ? STAGE_NODE_CLASSES[stage.id].active
                          : "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B]"
                      }
                    `}
                  >
                    {stage.number}
                  </div>
                  {i < stages.length - 1 ? (
                    <div className="flex-1 h-px bg-[#E8E6E3]" aria-hidden />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                </div>
                <span
                  className={`
                    mt-1 text-[10px] leading-tight px-0.5
                    ${isActive ? "text-[#2C2C2C] font-medium" : "text-[#6B6B6B]"}
                  `}
                >
                  {stage.shortTitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
