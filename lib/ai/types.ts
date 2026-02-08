import type {
  Constraint,
  DealStage,
  GovernmentProgram,
  ReadinessState,
  TimelineMilestone,
  StrategyComponentId,
  GradeLetter,
  StrategyGradeMissingElement,
} from "@/lib/types";

export interface MemoAnalysisResult {
  name: string;
  stage: DealStage;
  readinessState: ReadinessState;
  dominantConstraint: Constraint;
  summary: string;
  description: string;
  nextStep: string;
  investmentValue?: string;
  economicImpact?: string;
  keyStakeholders?: string[];
  risks?: string[];
  strategicActions?: string[];
  infrastructureNeeds?: string[];
  skillsImplications?: string;
  marketDrivers?: string;
  governmentPrograms?: GovernmentProgram[];
  timeline?: TimelineMilestone[];
  memoReference: { label: string; pageRef?: string };
  suggestedLocationText: string | null;
  suggestedLgaIds: string[];
  suggestedOpportunityType: {
    existingId?: string;
    proposedName?: string;
    proposedDefinition?: string;
    closestExistingId?: string;
    closestExistingReasoning?: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
  };
}

export interface ComponentExtraction {
  content: string;
  confidence: number;
  sourceExcerpt: string;
}

export interface StrategyExtractionResult {
  title: string;
  summary: string;
  components: Record<StrategyComponentId, ComponentExtraction>;
  selectionLogic: {
    adjacentDefinition: string | null;
    growthDefinition: string | null;
    criteria: string[];
  };
  crossCuttingThemes: string[];
  stakeholderCategories: string[];
  prioritySectorNames: string[];
  warnings: string[];
}

export interface StrategyGradeResult {
  id: string;
  strategyId: string;
  gradeLetter: GradeLetter;
  gradeRationaleShort: string;
  evidenceNotesByComponent: Partial<Record<StrategyComponentId, string>>;
  missingElements: StrategyGradeMissingElement[];
  scopeDisciplineNotes?: string;
  warnings: string[];
}
