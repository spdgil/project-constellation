/**
 * Data model (v1) — PRD §7.1
 * Entities and enums for the Constellation Development Facility.
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
  | "definition"          // Stage 1: Mandate Fit and Project Definition
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

/** Government program or funding reference */
export interface GovernmentProgram {
  name: string;
  description?: string;
}

/** Timeline milestone */
export interface TimelineMilestone {
  label: string;
  date?: string;
}

/** Attached document stored with a deal */
export interface DealDocument {
  id: string;
  /** Original file name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Public URL of the file in Vercel Blob storage */
  fileUrl: string;
  /** When the document was attached */
  addedAt: string;
  /** Optional user-provided label */
  label?: string;
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

  /* --- Rich fields (optional, populated from strategy documents) --- */

  /** Long-form description (2-3 paragraphs) */
  description?: string;
  /** Investment value — numeric amount in AUD */
  investmentValueAmount: number;
  /** Investment value — descriptive text */
  investmentValueDescription: string;
  /** Economic impact — numeric amount in AUD (e.g. GDP contribution) */
  economicImpactAmount: number;
  /** Economic impact — descriptive text */
  economicImpactDescription: string;
  /** Economic impact — number of jobs if known */
  economicImpactJobs?: number;
  /** Named organisations involved */
  keyStakeholders?: string[];
  /** Specific risks and challenges */
  risks?: string[];
  /** Recommended strategic actions */
  strategicActions?: string[];
  /** Supporting infrastructure requirements */
  infrastructureNeeds?: string[];
  /** Workforce and skills implications */
  skillsImplications?: string;
  /** Market drivers and demand signals */
  marketDrivers?: string;
  /** Related government policies and funding programs */
  governmentPrograms?: GovernmentProgram[];
  /** Key milestones and timeline events */
  timeline?: TimelineMilestone[];
  /** Attached documents (source memos, reports, etc.) */
  documents?: DealDocument[];
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

// =============================================================================
// Sector Opportunities & Strategies
// REFERENCE_SECTOR_OPPORTUNITY_TEMPLATE.md
// REFERENCE_SECTOR_DEVELOPMENT_STRATEGY_BLUEPRINT.md
// REFERENCE_STRATEGY_GRADING_SYSTEM.md
// =============================================================================

/** Grade letter for strategy assessment — REFERENCE_STRATEGY_GRADING_SYSTEM.md */
export type GradeLetter = "A" | "A-" | "B" | "B-" | "C" | "D" | "F";

/**
 * Section IDs for SectorOpportunity (1–10).
 * REFERENCE_SECTOR_OPPORTUNITY_TEMPLATE.md
 */
export type SectorOpportunitySectionId =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

/** Human-readable names for the 10 sector opportunity sections. */
export const SECTOR_OPPORTUNITY_SECTION_NAMES: Record<SectorOpportunitySectionId, string> = {
  "1": "Sector Opportunity Definition",
  "2": "Structural Drivers of the Opportunity",
  "3": "Economic Role of the Sector",
  "4": "Typical Value Chain Structure",
  "5": "Capability Requirements",
  "6": "Common Constraints and Failure Modes",
  "7": "Workforce and Skills Profile",
  "8": "Enabling Conditions",
  "9": "Maturity and Evolution Pathways",
  "10": "Strategic Implications",
};

/**
 * Sector Opportunity — place-agnostic reference object.
 * REFERENCE_SECTOR_OPPORTUNITY_TEMPLATE.md
 */
export interface SectorOpportunity {
  id: string;
  name: string;
  version: string;
  tags: string[];
  /** 10 sections keyed by SectorOpportunitySectionId, each containing markdown. */
  sections: Record<SectorOpportunitySectionId, string>;
  sources: string[];
}

/**
 * Blueprint component IDs for SectorDevelopmentStrategy (1–6).
 * REFERENCE_SECTOR_DEVELOPMENT_STRATEGY_BLUEPRINT.md
 */
export type StrategyComponentId = "1" | "2" | "3" | "4" | "5" | "6";

/** Human-readable names for the 6 strategy blueprint components. */
export const STRATEGY_COMPONENT_NAMES: Record<StrategyComponentId, string> = {
  "1": "Sector Diagnostics and Comparative Advantage",
  "2": "Economic Geography and Places of Production",
  "3": "Regulatory and Enabling Environment",
  "4": "Value Chain and Market Integration",
  "5": "Workforce and Skills Alignment",
  "6": "Sector Culture and Norms",
};

/** Economic Development Design Tool domains (EDDT visual). */
export const EDDT_DOMAINS = [
  "Market",
  "Capital",
  "Support Services",
  "Businesses",
  "Infrastructure",
  "Policy",
  "Culture",
] as const;
export type EddtDomain = (typeof EDDT_DOMAINS)[number];

/** Mapping of blueprint components to EDDT domains. */
export const STRATEGY_COMPONENT_EDDT_DOMAINS: Record<StrategyComponentId, EddtDomain[]> = {
  "1": ["Market", "Businesses"],
  "2": ["Infrastructure", "Businesses"],
  "3": ["Market", "Policy"],
  "4": ["Market", "Businesses"],
  "5": ["Support Services", "Businesses"],
  "6": ["Culture"],
};

/** Strategy lifecycle status. */
export type StrategyStatus = "draft" | "published";

/** Attached document stored with a strategy. */
export interface StrategyDocument {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  addedAt: string;
  label?: string;
}

/**
 * Sector Development Strategy — place-specific, linked to sector opportunities.
 * REFERENCE_SECTOR_DEVELOPMENT_STRATEGY_BLUEPRINT.md
 */
export interface SectorDevelopmentStrategy {
  id: string;
  title: string;
  type: string;
  status: StrategyStatus;
  sourceDocument?: string;
  summary: string;
  /** Raw extracted text from the uploaded source document. */
  extractedText?: string;
  /** 6 blueprint components keyed by StrategyComponentId, each containing markdown. */
  components: Record<StrategyComponentId, string>;
  selectionLogic?: {
    adjacentDefinition?: string;
    growthDefinition?: string;
    criteria: string[];
  };
  crossCuttingThemes: string[];
  stakeholderCategories: string[];
  /** IDs of linked SectorOpportunity records. */
  prioritySectorIds: string[];
}

/** Missing element in a strategy grading. */
export interface StrategyGradeMissingElement {
  componentId: StrategyComponentId;
  reason: string;
}

/**
 * Strategy grading — REFERENCE_STRATEGY_GRADING_SYSTEM.md
 */
export interface StrategyGrade {
  id: string;
  strategyId: string;
  gradeLetter: GradeLetter;
  gradeRationaleShort: string;
  /** Evidence notes keyed by blueprint component_id (1–6). */
  evidenceNotesByComponent: Partial<Record<StrategyComponentId, string>>;
  missingElements: StrategyGradeMissingElement[];
  scopeDisciplineNotes?: string;
}
