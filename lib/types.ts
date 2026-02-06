/**
 * Data model (v1) — PRD §7.1
 * Entities and enums for Project Constellation.
 */

// --- Enums / string unions (PRD §4.3, §4.4, §6.6) ---

/** Capital readiness ladder — PRD §4.3 */
export type ReadinessState =
  | "no-viable-projects"
  | "conceptual-interest"
  | "feasibility-underway"
  | "structurable-but-stalled"
  | "investable-with-minor-intervention"
  | "scaled-and-replicable";

/** Deal stage — PRD §6.6 */
export type DealStage =
  | "concept"
  | "feasibility"
  | "structuring"
  | "investment-ready"
  | "operating";

/** Dominant binding constraint — PRD §4.4 */
export type Constraint =
  | "revenue-certainty"
  | "offtake-demand-aggregation"
  | "planning-and-approvals"
  | "sponsor-capability"
  | "early-risk-capital"
  | "balance-sheet-constraints"
  | "technology-risk"
  | "coordination-failure"
  | "skills-and-workforce-constraint"
  | "common-user-infrastructure-gap";

// --- Entities ---

/** LGA-level opportunity hypothesis — PRD §6.3, §8.2 */
export interface LgaOpportunityHypothesis {
  id: string;
  name: string;
  summary?: string;
  dominantConstraint?: Constraint;
}

/** LGA (Place) — PRD §7.1; optional fields for LGA panel §6.3 */
export interface LGA {
  id: string;
  name: string;
  geometryRef: string;
  notes?: string[];
  /** Panel: Summary section (open by default) */
  summary?: string;
  /** Panel: Opportunity hypotheses (collapsed) */
  opportunityHypotheses?: LgaOpportunityHypothesis[];
  /** Panel: Active deals — deal IDs in this LGA */
  activeDealIds?: string[];
  /** Panel: Repeated constraints (local pattern) */
  repeatedConstraints?: Constraint[];
  /** Panel: Evidence and notes */
  evidence?: EvidenceRef[];
}

/** Opportunity type (taxonomy item) — PRD §7.1 */
export interface OpportunityType {
  id: string;
  name: string;
  definition: string;
  economicFunction: string;
  typicalCapitalStack: string;
  typicalRisks: string;
}

/** Evidence reference (internal) — PRD §6.6, §7.1 Deal.evidence */
export interface EvidenceRef {
  label?: string;
  url?: string;
  pageRef?: string;
}

/** Timestamped note — PRD §7.1 Deal.notes */
export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

/** Cluster — PRD §7.1 */
export interface Cluster {
  id: string;
  name: string;
  opportunityTypeId: string;
  lgaIds: string[];
  readinessState: ReadinessState;
  dominantConstraint: Constraint;
  rationale: string;
  dealIds: string[];
}

/** Deal (project instance) — PRD §7.1 */
export interface Deal {
  id: string;
  name: string;
  opportunityTypeId: string;
  lgaIds: string[];
  lat?: number;
  lng?: number;
  stage: DealStage;
  readinessState: ReadinessState;
  dominantConstraint: Constraint;
  summary: string;
  nextStep: string;
  evidence: EvidenceRef[];
  notes: Note[];
  updatedAt: string;
}

/** Constraint change audit — PRD §7.1 */
export interface ConstraintEvent {
  id: string;
  entityType: "deal" | "cluster";
  entityId: string;
  dominantConstraint: Constraint;
  changedAt: string;
  changeReason: string;
}

// --- GeoJSON (placeholder) ---

export interface GeoJSONFeature {
  type: "Feature";
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}
