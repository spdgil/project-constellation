/**
 * Monochromatic tinting colour maps for deal stages and readiness states.
 * Single source of truth — all components import from here.
 *
 * Formula: bg-{colour}-50  text-{colour}-700  border border-{colour}-200
 */

import type { ArtefactStatus, DealStage, ReadinessState } from "./types";

/** Badge/chip classes for deal stages. */
export const STAGE_COLOUR_CLASSES: Record<DealStage, string> = {
  definition: "bg-amber-50 text-amber-700 border border-amber-200",
  "pre-feasibility": "bg-amber-50 text-amber-700 border border-amber-200",
  feasibility: "bg-blue-50 text-blue-700 border border-blue-200",
  structuring: "bg-violet-50 text-violet-700 border border-violet-200",
  "transaction-close": "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

/** Badge/chip classes for readiness states. */
export const READINESS_COLOUR_CLASSES: Record<ReadinessState, string> = {
  "no-viable-projects": "bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]",
  "conceptual-interest": "bg-amber-50 text-amber-700 border border-amber-200",
  "feasibility-underway": "bg-amber-50 text-amber-700 border border-amber-200",
  "structurable-but-stalled": "bg-blue-50 text-blue-700 border border-blue-200",
  "investable-with-minor-intervention": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "scaled-and-replicable": "bg-emerald-100 text-emerald-800 border border-emerald-300",
};

/** Badge/chip classes for artefact status. */
export const ARTEFACT_STATUS_COLOUR_CLASSES: Record<ArtefactStatus, string> = {
  "not-started": "bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]",
  "in-progress": "bg-amber-50 text-amber-700 border border-amber-200",
  complete: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

/** Pipeline stepper node classes — active uses stage colour, inactive stays neutral. */
export const STAGE_NODE_CLASSES: Record<DealStage, { active: string; inactive: string }> = {
  definition: {
    active: "bg-amber-100 border-amber-400 text-amber-800",
    inactive: "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B] group-hover:border-[#2C2C2C] group-hover:text-[#2C2C2C]",
  },
  "pre-feasibility": {
    active: "bg-amber-100 border-amber-400 text-amber-800",
    inactive: "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B] group-hover:border-[#2C2C2C] group-hover:text-[#2C2C2C]",
  },
  feasibility: {
    active: "bg-blue-100 border-blue-400 text-blue-800",
    inactive: "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B] group-hover:border-[#2C2C2C] group-hover:text-[#2C2C2C]",
  },
  structuring: {
    active: "bg-violet-100 border-violet-400 text-violet-800",
    inactive: "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B] group-hover:border-[#2C2C2C] group-hover:text-[#2C2C2C]",
  },
  "transaction-close": {
    active: "bg-emerald-100 border-emerald-400 text-emerald-800",
    inactive: "bg-[#FFFFFF] border-[#E8E6E3] text-[#6B6B6B] group-hover:border-[#2C2C2C] group-hover:text-[#2C2C2C]",
  },
};
