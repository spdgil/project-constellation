/**
 * Typed loaders for static JSON in /data — PRD §7.2
 * No server DB; reads from repo data files.
 */

import type {
  LGA,
  OpportunityType,
  Deal,
  SectorOpportunity,
  SectorDevelopmentStrategy,
  StrategyGrade,
  StrategyGradeMissingElement,
  StrategyComponentId,
  GradeLetter,
  GeoJSONFeatureCollection,
} from "./types";

/** Normalise grade letters from DB/seed format (A_minus) to frontend format (A-). */
const GRADE_NORMALISE: Record<string, GradeLetter> = {
  A: "A",
  A_minus: "A-",
  "A-": "A-",
  B: "B",
  B_minus: "B-",
  "B-": "B-",
  C: "C",
  D: "D",
  F: "F",
};

function normaliseGrade(raw: string): GradeLetter {
  return GRADE_NORMALISE[raw] ?? (raw as GradeLetter);
}

// JSON is imported at build time; types asserted in loaders.

/** Load LGAs from data/lgas.json */
export async function loadLgas(): Promise<LGA[]> {
  const data = await import("@/data/lgas.json");
  return data.default as LGA[];
}

/** Load opportunity types from data/opportunityTypes.json */
export async function loadOpportunityTypes(): Promise<OpportunityType[]> {
  const data = await import("@/data/opportunityTypes.json");
  return data.default as OpportunityType[];
}

/** Load deals from data/deals.json */
export async function loadDeals(): Promise<Deal[]> {
  const data = await import("@/data/deals.json");
  return data.default as Deal[];
}

/** Load QLD LGA boundaries from data/qld-lga-boundaries.json (replace with .geojson when using real boundaries; add Turbopack/webpack rule then) */
export async function loadQldLgaBoundaries(): Promise<GeoJSONFeatureCollection> {
  const data = await import("@/data/qld-lga-boundaries.json");
  return data.default as GeoJSONFeatureCollection;
}

/** Load sector opportunities from data/sectorOpportunities.json */
export async function loadSectorOpportunities(): Promise<SectorOpportunity[]> {
  const data = await import("@/data/sectorOpportunities.json");
  const raw = data.default as Record<string, unknown>[];
  return raw.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    version: (r.version as string) ?? "1",
    tags: (r.tags as string[]) ?? [],
    sections: (r.sections ?? {}) as Record<string, string> as SectorOpportunity["sections"],
    sources: (r.sources as string[]) ?? [],
  }));
}

/** Raw strategy JSON shape (includes nested grading). */
interface RawStrategy {
  id: string;
  title: string;
  type?: string;
  sourceDocument?: string;
  summary?: string;
  prioritySectorIds?: string[];
  selectionLogic?: {
    adjacentDefinition?: string;
    growthDefinition?: string;
    criteria?: string[];
  };
  crossCuttingThemes?: string[];
  stakeholderCategories?: string[];
  grading?: {
    gradeLetter: string;
    gradeRationaleShort?: string;
    evidenceNotesByComponent?: Record<string, string>;
    missingElements?: { componentId: string; reason: string }[];
    scopeDisciplineNotes?: string;
  };
}

/** Load strategies from data/strategies.json */
export async function loadStrategies(): Promise<SectorDevelopmentStrategy[]> {
  const data = await import("@/data/strategies.json");
  const raw = data.default as RawStrategy[];
  return raw.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type ?? "sector_development_strategy",
    status: "published" as const,
    sourceDocument: r.sourceDocument,
    summary: r.summary ?? "",
    components: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" },
    selectionLogic: r.selectionLogic
      ? {
          adjacentDefinition: r.selectionLogic.adjacentDefinition,
          growthDefinition: r.selectionLogic.growthDefinition,
          criteria: r.selectionLogic.criteria ?? [],
        }
      : undefined,
    crossCuttingThemes: r.crossCuttingThemes ?? [],
    stakeholderCategories: r.stakeholderCategories ?? [],
    prioritySectorIds: r.prioritySectorIds ?? [],
  }));
}

/** Load strategy gradings from data/strategies.json */
export async function loadStrategyGrades(): Promise<StrategyGrade[]> {
  const data = await import("@/data/strategies.json");
  const raw = data.default as RawStrategy[];
  return raw
    .filter((r) => r.grading)
    .map((r) => {
      const g = r.grading!;
      return {
        id: `grade_${r.id}`,
        strategyId: r.id,
        gradeLetter: normaliseGrade(g.gradeLetter),
        gradeRationaleShort: g.gradeRationaleShort ?? "",
        evidenceNotesByComponent: (g.evidenceNotesByComponent ?? {}) as Partial<Record<StrategyComponentId, string>>,
        missingElements: (g.missingElements ?? []) as StrategyGradeMissingElement[],
        scopeDisciplineNotes: g.scopeDisciplineNotes,
      };
    });
}
