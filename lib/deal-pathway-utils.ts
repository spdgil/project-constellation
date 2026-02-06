/**
 * Deal ↔ Pathway utilities.
 * Initialise gate checklist and artefact entries from the pathway template.
 */

import type { DealStage, DealGateEntry, DealArtefact } from "./types";
import { PATHWAY_STAGES } from "./pathway-data";

/** Ordered stage list for iteration. */
export const STAGE_ORDER: DealStage[] = [
  "definition",
  "pre-feasibility",
  "feasibility",
  "structuring",
  "transaction-close",
];

/**
 * Return the numeric index (0-based) of a stage in the pathway.
 */
export function stageIndex(stage: DealStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Return all stages up to and including the given stage.
 */
export function stagesUpTo(stage: DealStage): DealStage[] {
  const idx = stageIndex(stage);
  return STAGE_ORDER.slice(0, idx + 1);
}

/**
 * Create pending gate checklist entries for a single stage
 * by reading the pathway template.
 */
export function initGateChecklist(stage: DealStage): DealGateEntry[] {
  const pathwayStage = PATHWAY_STAGES.find((s) => s.id === stage);
  if (!pathwayStage) return [];
  return pathwayStage.gateChecklist.map((item) => ({
    question: item.question,
    status: "pending",
  }));
}

/**
 * Create not-started artefact entries for a single stage
 * by reading the pathway template.
 */
export function initArtefacts(stage: DealStage): DealArtefact[] {
  const pathwayStage = PATHWAY_STAGES.find((s) => s.id === stage);
  if (!pathwayStage) return [];
  return pathwayStage.artefacts.map((name) => ({
    name,
    status: "not-started",
  }));
}

/**
 * Initialise gateChecklist and artefacts for all stages up to and including
 * the deal's current stage. Prior stages are marked satisfied/complete;
 * the current stage is pending/not-started.
 */
export function initDealPathwayFields(currentStage: DealStage): {
  gateChecklist: Partial<Record<DealStage, DealGateEntry[]>>;
  artefacts: Partial<Record<DealStage, DealArtefact[]>>;
} {
  const stages = stagesUpTo(currentStage);
  const gateChecklist: Partial<Record<DealStage, DealGateEntry[]>> = {};
  const artefacts: Partial<Record<DealStage, DealArtefact[]>> = {};

  for (const stage of stages) {
    const isCurrent = stage === currentStage;

    gateChecklist[stage] = initGateChecklist(stage).map((entry) => ({
      ...entry,
      status: isCurrent ? "pending" : "satisfied",
    }));

    artefacts[stage] = initArtefacts(stage).map((entry) => ({
      ...entry,
      status: isCurrent ? "not-started" : "complete",
    }));
  }

  return { gateChecklist, artefacts };
}

/**
 * Return the gate checklist entries for a specific stage from a deal,
 * falling back to initialised entries if none exist.
 */
export function getStageGateChecklist(
  dealGateChecklist: Partial<Record<DealStage, DealGateEntry[]>>,
  stage: DealStage,
): DealGateEntry[] {
  return dealGateChecklist[stage] ?? initGateChecklist(stage);
}

/**
 * Return the artefact entries for a specific stage from a deal,
 * falling back to initialised entries if none exist.
 */
export function getStageArtefacts(
  dealArtefacts: Partial<Record<DealStage, DealArtefact[]>>,
  stage: DealStage,
): DealArtefact[] {
  return dealArtefacts[stage] ?? initArtefacts(stage);
}
