/**
 * Server-side data-access functions.
 * Query Prisma and return data shaped as frontend types (kebab-case enums).
 * Used by server components (pages) and API routes.
 */

import { prisma } from "./prisma";
import {
  stageFromDb,
  readinessFromDb,
  constraintFromDb,
  constraintArrayFromDb,
  gateStatusFromDb,
  artefactStatusFromDb,
} from "./enum-maps";
import type {
  Deal,
  DealStage,
  DealGateEntry,
  DealArtefact,
  DealDocument,
  EvidenceRef,
  GovernmentProgram,
  TimelineMilestone,
  Note,
  LGA,
  LgaOpportunityHypothesis,
  OpportunityType,
  ConstraintEvent,
  Constraint,
  SectorOpportunity,
  SectorOpportunitySectionId,
  SectorDevelopmentStrategy,
  StrategyStatus,
  StrategyDocument,
  StrategyComponentId,
  StrategyGrade,
  StrategyGradeMissingElement,
} from "@/lib/types";
import { gradeLetterFromDb } from "./enum-maps";

// =============================================================================
// Deal includes (all relations for full deal objects)
// =============================================================================

const DEAL_INCLUDE = {
  lgas: true,
  evidence: true,
  notes: { orderBy: { createdAt: "desc" as const } },
  gateChecklist: true,
  artefacts: true,
  governmentPrograms: true,
  timeline: true,
  documents: { orderBy: { addedAt: "desc" as const } },
} as const;

// =============================================================================
// Mappers: Prisma model → frontend type
// =============================================================================

type PrismaDealFull = Awaited<
  ReturnType<typeof prisma.deal.findFirst<{ include: typeof DEAL_INCLUDE }>>
>;

function mapDeal(d: NonNullable<PrismaDealFull>): Deal {
  // Group gate entries by stage
  const gateChecklist: Partial<Record<DealStage, DealGateEntry[]>> = {};
  for (const g of d.gateChecklist) {
    const stage = stageFromDb(g.stage);
    if (!gateChecklist[stage]) gateChecklist[stage] = [];
    gateChecklist[stage]!.push({
      question: g.question,
      status: gateStatusFromDb(g.status),
    });
  }

  // Group artefacts by stage
  const artefacts: Partial<Record<DealStage, DealArtefact[]>> = {};
  for (const a of d.artefacts) {
    const stage = stageFromDb(a.stage);
    if (!artefacts[stage]) artefacts[stage] = [];
    artefacts[stage]!.push({
      name: a.name,
      status: artefactStatusFromDb(a.status),
      summary: a.summary ?? undefined,
      url: a.url ?? undefined,
    });
  }

  // Map evidence
  const evidence: EvidenceRef[] = d.evidence.map((e) => ({
    label: e.label ?? undefined,
    url: e.url ?? undefined,
    pageRef: e.pageRef ?? undefined,
  }));

  // Map notes
  const notes: Note[] = d.notes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
  }));

  // Map government programs
  const governmentPrograms: GovernmentProgram[] = d.governmentPrograms.map((gp) => ({
    name: gp.name,
    description: gp.description ?? undefined,
  }));

  // Map timeline
  const timeline: TimelineMilestone[] = d.timeline.map((t) => ({
    label: t.label,
    date: t.date ?? undefined,
  }));

  // Map documents
  const documents: DealDocument[] = d.documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    fileUrl: doc.fileUrl,
    addedAt: doc.addedAt.toISOString(),
    label: doc.label ?? undefined,
  }));

  return {
    id: d.id,
    name: d.name,
    opportunityTypeId: d.opportunityTypeId,
    lgaIds: d.lgas.map((l) => l.lgaId),
    lat: d.lat ?? undefined,
    lng: d.lng ?? undefined,
    stage: stageFromDb(d.stage),
    readinessState: readinessFromDb(d.readinessState),
    dominantConstraint: constraintFromDb(d.dominantConstraint),
    summary: d.summary,
    nextStep: d.nextStep,
    evidence,
    notes,
    updatedAt: d.updatedAt.toISOString(),
    gateChecklist,
    artefacts,
    description: d.description ?? undefined,
    investmentValueAmount: d.investmentValueAmount,
    investmentValueDescription: d.investmentValueDescription,
    economicImpactAmount: d.economicImpactAmount,
    economicImpactDescription: d.economicImpactDescription,
    economicImpactJobs: d.economicImpactJobs ?? undefined,
    keyStakeholders: d.keyStakeholders,
    risks: d.risks,
    strategicActions: d.strategicActions,
    infrastructureNeeds: d.infrastructureNeeds,
    skillsImplications: d.skillsImplications ?? undefined,
    marketDrivers: d.marketDrivers ?? undefined,
    governmentPrograms,
    timeline,
    documents,
  };
}

function mapLga(
  l: Awaited<ReturnType<typeof prisma.lga.findFirst<{
    include: { evidence: true; opportunityHypotheses: true; deals: true };
  }>>>
): LGA | null {
  if (!l) return null;
  return {
    id: l.id,
    name: l.name,
    geometryRef: l.geometryRef,
    summary: l.summary ?? undefined,
    notes: l.notes,
    repeatedConstraints: constraintArrayFromDb(l.repeatedConstraints as string[]),
    opportunityHypotheses: l.opportunityHypotheses.map(
      (oh): LgaOpportunityHypothesis => ({
        id: oh.id,
        name: oh.name,
        summary: oh.summary ?? undefined,
        dominantConstraint: oh.dominantConstraint
          ? constraintFromDb(oh.dominantConstraint as string)
          : undefined,
      })
    ),
    activeDealIds: l.deals.map((d) => d.dealId),
    evidence: l.evidence.map((e) => ({
      label: e.label ?? undefined,
      url: e.url ?? undefined,
      pageRef: e.pageRef ?? undefined,
    })),
  };
}

function mapOpportunityType(
  ot: Awaited<ReturnType<typeof prisma.opportunityType.findFirst>>
): OpportunityType | null {
  if (!ot) return null;
  return {
    id: ot.id,
    name: ot.name,
    definition: ot.definition,
    economicFunction: ot.economicFunction,
    typicalCapitalStack: ot.typicalCapitalStack,
    typicalRisks: ot.typicalRisks,
  };
}

// =============================================================================
// Query functions
// =============================================================================

/** Load all deals with all relations. */
export async function loadDeals(): Promise<Deal[]> {
  const rows = await prisma.deal.findMany({
    include: DEAL_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapDeal);
}

/** Load a single deal by ID. */
export async function loadDealById(id: string): Promise<Deal | null> {
  const row = await prisma.deal.findUnique({
    where: { id },
    include: DEAL_INCLUDE,
  });
  return row ? mapDeal(row) : null;
}

/** Load a single LGA by ID. */
export async function loadLgaById(id: string): Promise<LGA | null> {
  const row = await prisma.lga.findUnique({
    where: { id },
    include: {
      evidence: true,
      opportunityHypotheses: true,
      deals: true,
    },
  });
  return row ? mapLga(row) : null;
}

/** Load all LGAs with relations. */
export async function loadLgas(): Promise<LGA[]> {
  const rows = await prisma.lga.findMany({
    include: {
      evidence: true,
      opportunityHypotheses: true,
      deals: true,
    },
    orderBy: { name: "asc" },
  });
  return rows.map(mapLga).filter((l): l is LGA => l !== null);
}

/** Load all opportunity types. */
export async function loadOpportunityTypes(): Promise<OpportunityType[]> {
  const rows = await prisma.opportunityType.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map(mapOpportunityType).filter((ot): ot is OpportunityType => ot !== null);
}

/** Load constraint events for an entity. */
export async function loadConstraintEvents(entityId: string): Promise<ConstraintEvent[]> {
  const rows = await prisma.constraintEvent.findMany({
    where: { entityId },
    orderBy: { changedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    entityType: r.entityType as "deal" | "cluster",
    entityId: r.entityId,
    dominantConstraint: constraintFromDb(r.dominantConstraint as string),
    changedAt: r.changedAt.toISOString(),
    changeReason: r.changeReason,
  }));
}

/** Get document metadata (URL) for download/redirect. */
export async function getDocumentData(
  docId: string
): Promise<{ fileName: string; mimeType: string; fileUrl: string } | null> {
  const doc = await prisma.dealDocument.findUnique({
    where: { id: docId },
    select: { fileName: true, mimeType: true, fileUrl: true },
  });
  if (!doc) return null;
  return {
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileUrl: doc.fileUrl,
  };
}

// =============================================================================
// Sector Opportunities
// =============================================================================

function mapSectorOpportunity(
  row: Awaited<ReturnType<typeof prisma.sectorOpportunity.findFirst>>,
): SectorOpportunity | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    tags: row.tags,
    sections: {
      "1": row.section1,
      "2": row.section2,
      "3": row.section3,
      "4": row.section4,
      "5": row.section5,
      "6": row.section6,
      "7": row.section7,
      "8": row.section8,
      "9": row.section9,
      "10": row.section10,
    },
    sources: row.sources,
  };
}

/** Load all sector opportunities. */
export async function loadSectorOpportunities(): Promise<SectorOpportunity[]> {
  const rows = await prisma.sectorOpportunity.findMany({
    orderBy: { name: "asc" },
  });
  return rows
    .map(mapSectorOpportunity)
    .filter((s): s is SectorOpportunity => s !== null);
}

/** Load a single sector opportunity by ID. */
export async function loadSectorOpportunityById(
  id: string,
): Promise<SectorOpportunity | null> {
  const row = await prisma.sectorOpportunity.findUnique({ where: { id } });
  return mapSectorOpportunity(row);
}

// =============================================================================
// Sector Development Strategies
// =============================================================================

const STRATEGY_INCLUDE = {
  prioritySectors: {
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

type PrismaStrategyFull = Awaited<
  ReturnType<typeof prisma.sectorDevelopmentStrategy.findFirst<{ include: typeof STRATEGY_INCLUDE }>>
>;

function mapStrategy(row: NonNullable<PrismaStrategyFull>): SectorDevelopmentStrategy {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status as StrategyStatus,
    sourceDocument: row.sourceDocument ?? undefined,
    summary: row.summary,
    extractedText: row.extractedText ?? undefined,
    components: {
      "1": row.component1,
      "2": row.component2,
      "3": row.component3,
      "4": row.component4,
      "5": row.component5,
      "6": row.component6,
    },
    selectionLogic:
      row.selectionLogicAdjacentDef || row.selectionLogicGrowthDef || row.selectionCriteria.length > 0
        ? {
            adjacentDefinition: row.selectionLogicAdjacentDef ?? undefined,
            growthDefinition: row.selectionLogicGrowthDef ?? undefined,
            criteria: row.selectionCriteria,
          }
        : undefined,
    crossCuttingThemes: row.crossCuttingThemes,
    stakeholderCategories: row.stakeholderCategories,
    prioritySectorIds: row.prioritySectors.map((ps) => ps.sectorOpportunityId),
  };
}

/** Load all strategies with relations. */
export async function loadStrategies(): Promise<SectorDevelopmentStrategy[]> {
  const rows = await prisma.sectorDevelopmentStrategy.findMany({
    include: STRATEGY_INCLUDE,
    orderBy: { title: "asc" },
  });
  return rows.map(mapStrategy);
}

/** Load a single strategy by ID. */
export async function loadStrategyById(
  id: string,
): Promise<SectorDevelopmentStrategy | null> {
  const row = await prisma.sectorDevelopmentStrategy.findUnique({
    where: { id },
    include: STRATEGY_INCLUDE,
  });
  return row ? mapStrategy(row) : null;
}

// =============================================================================
// Strategy Grades
// =============================================================================

function mapStrategyGrade(
  row: Awaited<ReturnType<typeof prisma.strategyGrade.findFirst>>,
): StrategyGrade | null {
  if (!row) return null;

  const evidenceNotesByComponent: Partial<Record<StrategyComponentId, string>> = {};
  if (row.evidenceComp1) evidenceNotesByComponent["1"] = row.evidenceComp1;
  if (row.evidenceComp2) evidenceNotesByComponent["2"] = row.evidenceComp2;
  if (row.evidenceComp3) evidenceNotesByComponent["3"] = row.evidenceComp3;
  if (row.evidenceComp4) evidenceNotesByComponent["4"] = row.evidenceComp4;
  if (row.evidenceComp5) evidenceNotesByComponent["5"] = row.evidenceComp5;
  if (row.evidenceComp6) evidenceNotesByComponent["6"] = row.evidenceComp6;

  let missingElements: StrategyGradeMissingElement[] = [];
  try {
    missingElements = JSON.parse(row.missingElements) as StrategyGradeMissingElement[];
  } catch {
    /* default empty */
  }

  return {
    id: row.id,
    strategyId: row.strategyId,
    gradeLetter: gradeLetterFromDb(row.gradeLetter as string),
    gradeRationaleShort: row.gradeRationaleShort,
    evidenceNotesByComponent,
    missingElements,
    scopeDisciplineNotes: row.scopeDisciplineNotes ?? undefined,
  };
}

/** Load grading for a strategy. */
export async function loadStrategyGrade(
  strategyId: string,
): Promise<StrategyGrade | null> {
  const row = await prisma.strategyGrade.findUnique({
    where: { strategyId },
  });
  return mapStrategyGrade(row);
}

/** Load all strategy grades. */
export async function loadStrategyGrades(): Promise<StrategyGrade[]> {
  const rows = await prisma.strategyGrade.findMany();
  return rows
    .map(mapStrategyGrade)
    .filter((g): g is StrategyGrade => g !== null);
}
