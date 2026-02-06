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

/** Deal stage — 5-stage development pathway */
export type DealStage =
  | "definition"          // Stage 1: Enabling Environment and Project Definition
  | "pre-feasibility"     // Stage 2: Pre-feasibility and Prioritisation
  | "feasibility"         // Stage 3: Detailed Feasibility and Investment Appraisal
  | "structuring"         // Stage 4: Project Structuring and Risk Allocation
  | "transaction-close";  // Stage 5: Transaction Implementation and Financial Close

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

// --- Gate & Artefact tracking (pathway alignment) ---

/** Gate checklist entry status */
export type GateStatus = "pending" | "satisfied" | "not-applicable";

/** Per-deal gate checklist entry — mirrors PathwayGateItem.question */
export interface DealGateEntry {
  question: string;
  status: GateStatus;
}

/** Artefact/document status */
export type ArtefactStatus = "not-started" | "in-progress" | "complete";

/** Per-deal artefact tracking — mirrors PathwayStage.artefacts[i] */
export interface DealArtefact {
  name: string;
  status: ArtefactStatus;
  /** User's description of the document content */
  summary?: string;
  /** Link or reference to the actual document */
  url?: string;
}

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
  /** Gate checklist tracking per stage (populated up to current stage) */
  gateChecklist: Partial<Record<DealStage, DealGateEntry[]>>;
  /** Artefact/document tracking per stage (populated up to current stage) */
  artefacts: Partial<Record<DealStage, DealArtefact[]>>;
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

// --- GeoJSON ---

/** GeoJSON geometry types used in LGA boundaries. */
export type GeoJSONGeometryType = "Point" | "LineString" | "Polygon" | "MultiPolygon" | "MultiLineString" | "MultiPoint";

export interface GeoJSONGeometry {
  type: GeoJSONGeometryType;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export interface GeoJSONFeature {
  type: "Feature";
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}
