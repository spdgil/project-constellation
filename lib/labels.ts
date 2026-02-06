/**
 * Human-readable labels for enums — PRD §4.3, §4.4, §6.6
 */

import type {
  ReadinessState,
  DealStage,
  Constraint,
  GateStatus,
  ArtefactStatus,
} from "./types";

export const READINESS_LABELS: Record<ReadinessState, string> = {
  "no-viable-projects": "No viable projects",
  "conceptual-interest": "Conceptual interest",
  "feasibility-underway": "Feasibility underway",
  "structurable-but-stalled": "Structurable but stalled",
  "investable-with-minor-intervention": "Investable with minor intervention",
  "scaled-and-replicable": "Scaled and replicable",
};

export const STAGE_LABELS: Record<DealStage, string> = {
  definition: "Definition",
  "pre-feasibility": "Pre-feasibility",
  feasibility: "Feasibility",
  structuring: "Structuring",
  "transaction-close": "Transaction close",
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

export const GATE_STATUS_LABELS: Record<GateStatus, string> = {
  pending: "Pending",
  satisfied: "Satisfied",
  "not-applicable": "N/A",
};

export const ARTEFACT_STATUS_LABELS: Record<ArtefactStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  complete: "Complete",
};
