/**
 * Human-readable labels for enums — PRD §4.3, §4.4, §6.6
 */

import type { ReadinessState, DealStage, Constraint } from "./types";

export const READINESS_LABELS: Record<ReadinessState, string> = {
  "no-viable-projects": "No viable projects",
  "conceptual-interest": "Conceptual interest",
  "feasibility-underway": "Feasibility underway",
  "structurable-but-stalled": "Structurable but stalled",
  "investable-with-minor-intervention": "Investable with minor intervention",
  "scaled-and-replicable": "Scaled and replicable",
};

export const STAGE_LABELS: Record<DealStage, string> = {
  concept: "Concept",
  feasibility: "Feasibility",
  structuring: "Structuring",
  "investment-ready": "Investment ready",
  operating: "Operating",
};

export const CONSTRAINT_LABELS: Record<Constraint, string> = {
  "revenue-certainty": "Revenue certainty",
  "offtake-demand-aggregation": "Offtake / demand aggregation",
  "planning-and-approvals": "Planning and approvals",
  "sponsor-capability": "Sponsor capability",
  "early-risk-capital": "Early risk capital",
  "balance-sheet-constraints": "Balance sheet constraints",
  "technology-risk": "Technology risk",
  "coordination-failure": "Coordination failure",
  "skills-and-workforce-constraint": "Skills and workforce constraint",
  "common-user-infrastructure-gap": "Common-user infrastructure gap",
};
