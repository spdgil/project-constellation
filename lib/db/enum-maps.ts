/**
 * Bidirectional maps between Prisma enum values (underscore_case)
 * and frontend string union values (kebab-case).
 *
 * The `toDb` functions return the **exact Prisma-generated enum types**
 * so that route handlers can pass values directly into Prisma create/update
 * calls without `as never` assertions.
 */

import type {
  DealStage as FrontendDealStage,
  ReadinessState as FrontendReadinessState,
  Constraint as FrontendConstraint,
  GateStatus as FrontendGateStatus,
  ArtefactStatus as FrontendArtefactStatus,
  GradeLetter as FrontendGradeLetter,
} from "@/lib/types";

import type {
  DealStage as PrismaDealStage,
  ReadinessState as PrismaReadinessState,
  Constraint as PrismaConstraint,
  GateStatus as PrismaGateStatus,
  ArtefactStatus as PrismaArtefactStatus,
  GradeLetter as PrismaGradeLetter,
} from "@/lib/generated/prisma/client";

// --- Stage ---

const STAGE_TO_DB: Record<FrontendDealStage, PrismaDealStage> = {
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

export function stageToDb(s: FrontendDealStage): PrismaDealStage {
  return STAGE_TO_DB[s];
}

export function stageFromDb(s: string): FrontendDealStage {
  return STAGE_FROM_DB[s] ?? (s as FrontendDealStage);
}

// --- ReadinessState ---

const READINESS_TO_DB: Record<FrontendReadinessState, PrismaReadinessState> = {
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

export function readinessToDb(r: FrontendReadinessState): PrismaReadinessState {
  return READINESS_TO_DB[r];
}

export function readinessFromDb(r: string): FrontendReadinessState {
  return READINESS_FROM_DB[r] ?? (r as FrontendReadinessState);
}

// --- Constraint ---

const CONSTRAINT_TO_DB: Record<FrontendConstraint, PrismaConstraint> = {
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

export function constraintToDb(c: FrontendConstraint): PrismaConstraint {
  return CONSTRAINT_TO_DB[c];
}

export function constraintFromDb(c: string): FrontendConstraint {
  return CONSTRAINT_FROM_DB[c] ?? (c as FrontendConstraint);
}

export function constraintArrayFromDb(arr: string[]): FrontendConstraint[] {
  return arr.map(constraintFromDb);
}

// --- GateStatus ---

const GATE_TO_DB: Record<FrontendGateStatus, PrismaGateStatus> = {
  pending: "pending",
  satisfied: "satisfied",
  "not-applicable": "not_applicable",
};

const GATE_FROM_DB: Record<string, FrontendGateStatus> = {
  pending: "pending",
  satisfied: "satisfied",
  not_applicable: "not-applicable",
};

export function gateStatusFromDb(s: string): FrontendGateStatus {
  return GATE_FROM_DB[s] ?? (s as FrontendGateStatus);
}

export function gateStatusToDb(s: FrontendGateStatus): PrismaGateStatus {
  return GATE_TO_DB[s];
}

// --- ArtefactStatus ---

const ARTEFACT_TO_DB: Record<FrontendArtefactStatus, PrismaArtefactStatus> = {
  "not-started": "not_started",
  "in-progress": "in_progress",
  complete: "complete",
};

const ARTEFACT_FROM_DB: Record<string, FrontendArtefactStatus> = {
  not_started: "not-started",
  in_progress: "in-progress",
  complete: "complete",
};

export function artefactStatusFromDb(s: string): FrontendArtefactStatus {
  return ARTEFACT_FROM_DB[s] ?? (s as FrontendArtefactStatus);
}

export function artefactStatusToDb(s: FrontendArtefactStatus): PrismaArtefactStatus {
  return ARTEFACT_TO_DB[s];
}

// --- GradeLetter ---

const GRADE_TO_DB: Record<FrontendGradeLetter, PrismaGradeLetter> = {
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

export function gradeLetterToDb(g: FrontendGradeLetter): PrismaGradeLetter {
  return GRADE_TO_DB[g];
}

export function gradeLetterFromDb(g: string): FrontendGradeLetter {
  return GRADE_FROM_DB[g] ?? (g as FrontendGradeLetter);
}
