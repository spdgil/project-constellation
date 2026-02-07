/**
 * Bidirectional maps between Prisma enum values (underscore_case)
 * and frontend string union values (kebab-case).
 */

import type {
  DealStage as FrontendDealStage,
  ReadinessState as FrontendReadinessState,
  Constraint as FrontendConstraint,
  GateStatus as FrontendGateStatus,
  ArtefactStatus as FrontendArtefactStatus,
} from "@/lib/types";

// --- Stage ---

const STAGE_TO_DB: Record<string, string> = {
  definition: "definition",
  "pre-feasibility": "pre_feasibility",
  feasibility: "feasibility",
  structuring: "structuring",
  "transaction-close": "transaction_close",
};

const STAGE_FROM_DB: Record<string, FrontendDealStage> = {
  definition: "definition",
  pre_feasibility: "pre-feasibility",
  feasibility: "feasibility",
  structuring: "structuring",
  transaction_close: "transaction-close",
};

export function stageToDb(s: FrontendDealStage): string {
  return STAGE_TO_DB[s] ?? s;
}

export function stageFromDb(s: string): FrontendDealStage {
  return STAGE_FROM_DB[s] ?? (s as FrontendDealStage);
}

// --- ReadinessState ---

const READINESS_TO_DB: Record<string, string> = {
  "no-viable-projects": "no_viable_projects",
  "conceptual-interest": "conceptual_interest",
  "feasibility-underway": "feasibility_underway",
  "structurable-but-stalled": "structurable_but_stalled",
  "investable-with-minor-intervention": "investable_with_minor_intervention",
  "scaled-and-replicable": "scaled_and_replicable",
};

const READINESS_FROM_DB: Record<string, FrontendReadinessState> = {
  no_viable_projects: "no-viable-projects",
  conceptual_interest: "conceptual-interest",
  feasibility_underway: "feasibility-underway",
  structurable_but_stalled: "structurable-but-stalled",
  investable_with_minor_intervention: "investable-with-minor-intervention",
  scaled_and_replicable: "scaled-and-replicable",
};

export function readinessToDb(r: FrontendReadinessState): string {
  return READINESS_TO_DB[r] ?? r;
}

export function readinessFromDb(r: string): FrontendReadinessState {
  return READINESS_FROM_DB[r] ?? (r as FrontendReadinessState);
}

// --- Constraint ---

const CONSTRAINT_TO_DB: Record<string, string> = {
  "revenue-certainty": "revenue_certainty",
  "offtake-demand-aggregation": "offtake_demand_aggregation",
  "planning-and-approvals": "planning_and_approvals",
  "sponsor-capability": "sponsor_capability",
  "early-risk-capital": "early_risk_capital",
  "balance-sheet-constraints": "balance_sheet_constraints",
  "technology-risk": "technology_risk",
  "coordination-failure": "coordination_failure",
  "skills-and-workforce-constraint": "skills_and_workforce_constraint",
  "common-user-infrastructure-gap": "common_user_infrastructure_gap",
};

const CONSTRAINT_FROM_DB: Record<string, FrontendConstraint> = {
  revenue_certainty: "revenue-certainty",
  offtake_demand_aggregation: "offtake-demand-aggregation",
  planning_and_approvals: "planning-and-approvals",
  sponsor_capability: "sponsor-capability",
  early_risk_capital: "early-risk-capital",
  balance_sheet_constraints: "balance-sheet-constraints",
  technology_risk: "technology-risk",
  coordination_failure: "coordination-failure",
  skills_and_workforce_constraint: "skills-and-workforce-constraint",
  common_user_infrastructure_gap: "common-user-infrastructure-gap",
};

export function constraintToDb(c: FrontendConstraint): string {
  return CONSTRAINT_TO_DB[c] ?? c;
}

export function constraintFromDb(c: string): FrontendConstraint {
  return CONSTRAINT_FROM_DB[c] ?? (c as FrontendConstraint);
}

export function constraintArrayFromDb(arr: string[]): FrontendConstraint[] {
  return arr.map(constraintFromDb);
}

// --- GateStatus ---

const GATE_FROM_DB: Record<string, FrontendGateStatus> = {
  pending: "pending",
  satisfied: "satisfied",
  not_applicable: "not-applicable",
};

export function gateStatusFromDb(s: string): FrontendGateStatus {
  return GATE_FROM_DB[s] ?? (s as FrontendGateStatus);
}

export function gateStatusToDb(s: FrontendGateStatus): string {
  const map: Record<string, string> = {
    pending: "pending",
    satisfied: "satisfied",
    "not-applicable": "not_applicable",
  };
  return map[s] ?? s;
}

// --- ArtefactStatus ---

const ARTEFACT_FROM_DB: Record<string, FrontendArtefactStatus> = {
  not_started: "not-started",
  in_progress: "in-progress",
  complete: "complete",
};

export function artefactStatusFromDb(s: string): FrontendArtefactStatus {
  return ARTEFACT_FROM_DB[s] ?? (s as FrontendArtefactStatus);
}

export function artefactStatusToDb(s: FrontendArtefactStatus): string {
  const map: Record<string, string> = {
    "not-started": "not_started",
    "in-progress": "in_progress",
    complete: "complete",
  };
  return map[s] ?? s;
}

// --- GradeLetter ---

import type { GradeLetter as FrontendGradeLetter } from "@/lib/types";

const GRADE_TO_DB: Record<string, string> = {
  A: "A",
  "A-": "A_minus",
  B: "B",
  "B-": "B_minus",
  C: "C",
  D: "D",
  F: "F",
};

const GRADE_FROM_DB: Record<string, FrontendGradeLetter> = {
  A: "A",
  A_minus: "A-",
  B: "B",
  B_minus: "B-",
  C: "C",
  D: "D",
  F: "F",
};

export function gradeLetterToDb(g: FrontendGradeLetter): string {
  return GRADE_TO_DB[g] ?? g;
}

export function gradeLetterFromDb(g: string): FrontendGradeLetter {
  return GRADE_FROM_DB[g] ?? (g as FrontendGradeLetter);
}
