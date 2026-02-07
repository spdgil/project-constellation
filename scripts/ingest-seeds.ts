#!/usr/bin/env tsx
/**
 * ingest-seeds.ts
 * ---------------
 * Dev-only CLI that reads the external SEED_GW3_*.json files and writes
 * normalised versions into data/ for the app's static loaders and prisma/seed.ts.
 *
 * Usage:
 *   npx tsx scripts/ingest-seeds.ts <path-to-SEED_GW3_SECTOR_OPPORTUNITIES.json> <path-to-SEED_GW3_STRATEGY_RECORD.json>
 *
 * Or via npm script:
 *   npm run seed:ingest -- <path1> <path2>
 *
 * After ingestion the data/ JSONs are updated. Run `npm run db:seed` to push
 * the new data into Postgres.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function die(msg: string): never {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

function readJson(filePath: string): unknown {
  try {
    const abs = resolve(filePath);
    const raw = readFileSync(abs, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    die(`Cannot read ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function prettyWrite(destPath: string, data: unknown) {
  const abs = resolve(destPath);
  writeFileSync(abs, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  ✓ Wrote ${abs}`);
}

// ---------------------------------------------------------------------------
// Transformers: external snake_case → app camelCase
// ---------------------------------------------------------------------------

interface ExternalSectorOpportunity {
  id: string;
  name: string;
  tags?: string[];
  sections?: Record<string, string>;
  sources?: string[];
}

interface ExternalSectorOpportunitiesFile {
  version: string;
  source: string;
  sector_opportunities: ExternalSectorOpportunity[];
}

interface ExternalStrategy {
  id: string;
  title: string;
  type?: string;
  source_document?: string;
  summary?: string;
  priority_sectors?: string[];
  selection_logic?: {
    adjacent_definition?: string;
    growth_definition?: string;
    criteria?: string[];
  };
  cross_cutting_action_themes?: string[];
  stakeholder_categories?: string[];
}

interface ExternalGrading {
  strategy_id: string;
  grade_letter: string;
  grade_rationale_short?: string;
  evidence_notes_by_component?: Record<string, string>;
  missing_elements?: { component_id: string; reason: string }[];
  scope_discipline_notes?: string;
}

interface ExternalStrategyFile {
  version: string;
  strategy: ExternalStrategy;
  grading?: ExternalGrading;
}

function transformSectorOpportunities(raw: ExternalSectorOpportunitiesFile) {
  return raw.sector_opportunities.map((so) => ({
    id: so.id,
    name: so.name,
    version: raw.version,
    tags: so.tags ?? [],
    sections: so.sections ?? {},
    sources: so.sources ?? [raw.source],
  }));
}

function transformStrategies(raw: ExternalStrategyFile) {
  const s = raw.strategy;
  const record: Record<string, unknown> = {
    id: s.id,
    title: s.title,
    type: s.type ?? "sector_development_strategy",
    sourceDocument: s.source_document,
    summary: s.summary ?? "",
    prioritySectorIds: s.priority_sectors ?? [],
    selectionLogic: s.selection_logic
      ? {
          adjacentDefinition: s.selection_logic.adjacent_definition,
          growthDefinition: s.selection_logic.growth_definition,
          criteria: s.selection_logic.criteria ?? [],
        }
      : undefined,
    crossCuttingThemes: s.cross_cutting_action_themes ?? [],
    stakeholderCategories: s.stakeholder_categories ?? [],
  };

  if (raw.grading) {
    const g = raw.grading;
    record.grading = {
      gradeLetter: g.grade_letter,
      gradeRationaleShort: g.grade_rationale_short ?? "",
      evidenceNotesByComponent: g.evidence_notes_by_component ?? {},
      missingElements: (g.missing_elements ?? []).map((me) => ({
        componentId: me.component_id,
        reason: me.reason,
      })),
      scopeDisciplineNotes: g.scope_discipline_notes,
    };
  }

  return [record];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
  Usage:
    npx tsx scripts/ingest-seeds.ts <SEED_GW3_SECTOR_OPPORTUNITIES.json> <SEED_GW3_STRATEGY_RECORD.json>

  Example:
    npx tsx scripts/ingest-seeds.ts \\
      ~/Downloads/ProjectConstellation_SectorArtifacts_Package/SEED_GW3_SECTOR_OPPORTUNITIES.json \\
      ~/Downloads/ProjectConstellation_SectorArtifacts_Package/SEED_GW3_STRATEGY_RECORD.json
`);
    process.exit(1);
  }

  const soPath = args[0];
  const stPath = args[1];

  console.log("\n  Ingesting seed files…");
  console.log(`    Opportunities: ${basename(soPath)}`);
  console.log(`    Strategy:      ${basename(stPath)}`);

  // --- Sector Opportunities ---
  const soRaw = readJson(soPath) as ExternalSectorOpportunitiesFile;
  if (!soRaw.sector_opportunities || !Array.isArray(soRaw.sector_opportunities)) {
    die("Expected sector_opportunities array at root of opportunities file.");
  }
  const sectorOpportunities = transformSectorOpportunities(soRaw);
  prettyWrite("data/sectorOpportunities.json", sectorOpportunities);

  // --- Strategy + Grading ---
  const stRaw = readJson(stPath) as ExternalStrategyFile;
  if (!stRaw.strategy || !stRaw.strategy.id) {
    die("Expected strategy object at root of strategy file.");
  }
  const strategies = transformStrategies(stRaw);
  prettyWrite("data/strategies.json", strategies);

  console.log(`
  Done. ${sectorOpportunities.length} sector opportunities and ${strategies.length} strategy record(s) written.

  Next steps:
    1. Run  npm run db:seed   to push into Postgres.
    2. Restart the dev server if running.
`);
}

main();
