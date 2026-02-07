// @ts-nocheck — Seed script uses dynamic JSON data with string-typed enum values
/**
 * Seed script — populates the database from static JSON files.
 * Run with: npm run db:seed
 */

import "dotenv/config";

// Dynamic import of generated Prisma client (ESM)
async function run() {
  const prismaModule = await import("../lib/generated/prisma/client.js");
  const PrismaClient = prismaModule.PrismaClient;
  const { PrismaPg } = await import("@prisma/adapter-pg");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Load JSON data
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const lgas = require("../data/lgas.json") as Record<string, unknown>[];
  const deals = require("../data/deals.json") as Record<string, unknown>[];
  const opportunityTypes = require("../data/opportunityTypes.json") as Record<string, unknown>[];
  const sectorOpportunities = require("../data/sectorOpportunities.json") as Record<string, unknown>[];
  const strategies = require("../data/strategies.json") as Record<string, unknown>[];

  // ==========================================================================
  // Value mappers: JSON kebab-case → Prisma enum underscore-case
  // ==========================================================================

  const stageMap: Record<string, string> = {
    definition: "definition",
    "pre-feasibility": "pre_feasibility",
    feasibility: "feasibility",
    structuring: "structuring",
    "transaction-close": "transaction_close",
  };

  const readinessMap: Record<string, string> = {
    "no-viable-projects": "no_viable_projects",
    "conceptual-interest": "conceptual_interest",
    "feasibility-underway": "feasibility_underway",
    "structurable-but-stalled": "structurable_but_stalled",
    "investable-with-minor-intervention": "investable_with_minor_intervention",
    "scaled-and-replicable": "scaled_and_replicable",
  };

  const constraintMap: Record<string, string> = {
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

  const gateStatusMap: Record<string, string> = {
    pending: "pending",
    satisfied: "satisfied",
    "not-applicable": "not_applicable",
  };

  const artefactStatusMap: Record<string, string> = {
    "not-started": "not_started",
    "in-progress": "in_progress",
    complete: "complete",
  };

  const gradeLetterMap: Record<string, string> = {
    A: "A",
    "A-": "A_minus",
    "A_minus": "A_minus",
    B: "B",
    "B-": "B_minus",
    "B_minus": "B_minus",
    C: "C",
    D: "D",
    F: "F",
  };

  // ==========================================================================
  // Seed
  // ==========================================================================

  console.log("🌱 Seeding database…");

  // --- 1. Opportunity Types ---
  console.log(`  Opportunity types: ${opportunityTypes.length}`);
  for (const ot of opportunityTypes) {
    await prisma.opportunityType.upsert({
      where: { id: ot.id as string },
      update: {
        name: ot.name as string,
        definition: (ot.definition as string) ?? "",
        economicFunction: (ot.economicFunction as string) ?? "",
        typicalCapitalStack: (ot.typicalCapitalStack as string) ?? "",
        typicalRisks: (ot.typicalRisks as string) ?? "",
      },
      create: {
        id: ot.id as string,
        name: ot.name as string,
        definition: (ot.definition as string) ?? "",
        economicFunction: (ot.economicFunction as string) ?? "",
        typicalCapitalStack: (ot.typicalCapitalStack as string) ?? "",
        typicalRisks: (ot.typicalRisks as string) ?? "",
      },
    });
  }

  // --- 2. LGAs ---
  console.log(`  LGAs: ${lgas.length}`);
  for (const lga of lgas) {
    const repeatedConstraints = ((lga.repeatedConstraints ?? []) as string[]).map(
      (c) => constraintMap[c]!
    );
    await prisma.lga.upsert({
      where: { id: lga.id as string },
      update: {
        name: lga.name as string,
        geometryRef: lga.geometryRef as string,
        summary: (lga.summary as string) ?? null,
        notes: (lga.notes as string[]) ?? [],
        repeatedConstraints,
      },
      create: {
        id: lga.id as string,
        name: lga.name as string,
        geometryRef: lga.geometryRef as string,
        summary: (lga.summary as string) ?? null,
        notes: (lga.notes as string[]) ?? [],
        repeatedConstraints,
      },
    });

    // Opportunity hypotheses
    const hypotheses = (lga.opportunityHypotheses ?? []) as Record<string, unknown>[];
    for (const oh of hypotheses) {
      await prisma.lgaOpportunityHypothesis.upsert({
        where: { id: oh.id as string },
        update: {
          name: oh.name as string,
          summary: (oh.summary as string) ?? null,
          dominantConstraint: oh.dominantConstraint
            ? constraintMap[oh.dominantConstraint as string]!
            : null,
        },
        create: {
          id: oh.id as string,
          lgaId: lga.id as string,
          name: oh.name as string,
          summary: (oh.summary as string) ?? null,
          dominantConstraint: oh.dominantConstraint
            ? constraintMap[oh.dominantConstraint as string]!
            : null,
        },
      });
    }

    // Evidence
    const lgaEvidence = (lga.evidence ?? []) as Record<string, string>[];
    await prisma.lgaEvidence.deleteMany({ where: { lgaId: lga.id as string } });
    for (const ev of lgaEvidence) {
      await prisma.lgaEvidence.create({
        data: {
          lgaId: lga.id as string,
          label: ev.label ?? null,
          url: ev.url ?? null,
          pageRef: ev.pageRef ?? null,
        },
      });
    }
  }

  // --- 3. Deals ---
  console.log(`  Deals: ${deals.length}`);
  for (const d of deals) {
    const dealData = {
      id: d.id as string,
      name: d.name as string,
      opportunityTypeId: d.opportunityTypeId as string,
      lat: (d.lat as number) ?? null,
      lng: (d.lng as number) ?? null,
      stage: stageMap[d.stage as string]!,
      readinessState: readinessMap[d.readinessState as string]!,
      dominantConstraint: constraintMap[d.dominantConstraint as string]!,
      summary: d.summary as string,
      nextStep: (d.nextStep as string) ?? "",
      description: (d.description as string) ?? null,
      investmentValueAmount: (d.investmentValueAmount as number) ?? 0,
      investmentValueDescription: (d.investmentValueDescription as string) ?? "",
      economicImpactAmount: (d.economicImpactAmount as number) ?? 0,
      economicImpactDescription: (d.economicImpactDescription as string) ?? "",
      economicImpactJobs: (d.economicImpactJobs as number) ?? null,
      keyStakeholders: (d.keyStakeholders as string[]) ?? [],
      risks: (d.risks as string[]) ?? [],
      strategicActions: (d.strategicActions as string[]) ?? [],
      infrastructureNeeds: (d.infrastructureNeeds as string[]) ?? [],
      skillsImplications: (d.skillsImplications as string) ?? null,
      marketDrivers: (d.marketDrivers as string) ?? null,
      updatedAt: new Date(d.updatedAt as string),
    };

    await prisma.deal.upsert({
      where: { id: d.id as string },
      update: dealData,
      create: dealData,
    });

    // Deal ↔ LGA relations
    const lgaIds = (d.lgaIds as string[]) ?? [];
    for (const lgaId of lgaIds) {
      await prisma.dealLga.upsert({
        where: { dealId_lgaId: { dealId: d.id as string, lgaId } },
        update: {},
        create: { dealId: d.id as string, lgaId },
      });
    }

    // Evidence
    await prisma.dealEvidence.deleteMany({ where: { dealId: d.id as string } });
    const evidence = (d.evidence ?? []) as Record<string, string>[];
    for (const ev of evidence) {
      await prisma.dealEvidence.create({
        data: {
          dealId: d.id as string,
          label: ev.label ?? null,
          url: ev.url ?? null,
          pageRef: ev.pageRef ?? null,
        },
      });
    }

    // Gate checklist
    await prisma.dealGateEntry.deleteMany({ where: { dealId: d.id as string } });
    const gateChecklist = (d.gateChecklist ?? {}) as Record<string, Record<string, string>[]>;
    for (const [stage, entries] of Object.entries(gateChecklist)) {
      for (const entry of entries) {
        await prisma.dealGateEntry.create({
          data: {
            dealId: d.id as string,
            stage: stageMap[stage]!,
            question: entry.question,
            status: gateStatusMap[entry.status]!,
          },
        });
      }
    }

    // Artefacts
    await prisma.dealArtefact.deleteMany({ where: { dealId: d.id as string } });
    const artefacts = (d.artefacts ?? {}) as Record<string, Record<string, string>[]>;
    for (const [stage, entries] of Object.entries(artefacts)) {
      for (const entry of entries) {
        await prisma.dealArtefact.create({
          data: {
            dealId: d.id as string,
            stage: stageMap[stage]!,
            name: entry.name,
            status: artefactStatusMap[entry.status]!,
            summary: entry.summary ?? null,
            url: entry.url ?? null,
          },
        });
      }
    }

    // Government programs
    await prisma.dealGovernmentProgram.deleteMany({ where: { dealId: d.id as string } });
    const govProgs = (d.governmentPrograms ?? []) as Record<string, string>[];
    for (const gp of govProgs) {
      await prisma.dealGovernmentProgram.create({
        data: {
          dealId: d.id as string,
          name: gp.name,
          description: gp.description ?? null,
        },
      });
    }

    // Timeline
    await prisma.dealTimelineMilestone.deleteMany({ where: { dealId: d.id as string } });
    const timeline = (d.timeline ?? []) as Record<string, string>[];
    for (const tm of timeline) {
      await prisma.dealTimelineMilestone.create({
        data: {
          dealId: d.id as string,
          label: tm.label,
          date: tm.date ?? null,
        },
      });
    }
  }

  // --- 4. Sector Opportunities ---
  console.log(`  Sector opportunities: ${sectorOpportunities.length}`);
  for (const so of sectorOpportunities) {
    const sections = (so.sections ?? {}) as Record<string, string>;
    const soData = {
      name: so.name as string,
      version: (so.version as string) ?? "1",
      tags: (so.tags as string[]) ?? [],
      section1: sections["1"] ?? "",
      section2: sections["2"] ?? "",
      section3: sections["3"] ?? "",
      section4: sections["4"] ?? "",
      section5: sections["5"] ?? "",
      section6: sections["6"] ?? "",
      section7: sections["7"] ?? "",
      section8: sections["8"] ?? "",
      section9: sections["9"] ?? "",
      section10: sections["10"] ?? "",
      sources: (so.sources as string[]) ?? [],
    };
    await prisma.sectorOpportunity.upsert({
      where: { id: so.id as string },
      update: soData,
      create: { id: so.id as string, ...soData },
    });
  }

  // --- 5. Strategies + Grading ---
  console.log(`  Strategies: ${strategies.length}`);
  for (const s of strategies) {
    const selectionLogic = (s.selectionLogic ?? {}) as Record<string, unknown>;
    const stratData = {
      title: s.title as string,
      type: (s.type as string) ?? "sector_development_strategy",
      sourceDocument: (s.sourceDocument as string) ?? null,
      summary: (s.summary as string) ?? "",
      // Components (strategies JSON doesn't have component content yet — default empty)
      component1: "",
      component2: "",
      component3: "",
      component4: "",
      component5: "",
      component6: "",
      selectionLogicAdjacentDef: (selectionLogic.adjacentDefinition as string) ?? null,
      selectionLogicGrowthDef: (selectionLogic.growthDefinition as string) ?? null,
      selectionCriteria: (selectionLogic.criteria as string[]) ?? [],
      crossCuttingThemes: (s.crossCuttingThemes as string[]) ?? [],
      stakeholderCategories: (s.stakeholderCategories as string[]) ?? [],
    };
    await prisma.sectorDevelopmentStrategy.upsert({
      where: { id: s.id as string },
      update: stratData,
      create: { id: s.id as string, ...stratData },
    });

    // Priority sector links
    const prioritySectorIds = (s.prioritySectorIds as string[]) ?? [];
    // Clear existing links then re-create with sort order
    await prisma.strategySectorOpportunity.deleteMany({
      where: { strategyId: s.id as string },
    });
    for (let i = 0; i < prioritySectorIds.length; i++) {
      await prisma.strategySectorOpportunity.create({
        data: {
          strategyId: s.id as string,
          sectorOpportunityId: prioritySectorIds[i],
          sortOrder: i,
        },
      });
    }

    // Grading
    const grading = s.grading as Record<string, unknown> | undefined;
    if (grading) {
      const evidenceByComp = (grading.evidenceNotesByComponent ?? {}) as Record<string, string>;
      const missingElements = (grading.missingElements ?? []) as Record<string, string>[];
      const gradeData = {
        gradeLetter: gradeLetterMap[(grading.gradeLetter as string)] ?? "C",
        gradeRationaleShort: (grading.gradeRationaleShort as string) ?? "",
        evidenceComp1: evidenceByComp["1"] ?? null,
        evidenceComp2: evidenceByComp["2"] ?? null,
        evidenceComp3: evidenceByComp["3"] ?? null,
        evidenceComp4: evidenceByComp["4"] ?? null,
        evidenceComp5: evidenceByComp["5"] ?? null,
        evidenceComp6: evidenceByComp["6"] ?? null,
        missingElements: JSON.stringify(missingElements),
        scopeDisciplineNotes: (grading.scopeDisciplineNotes as string) ?? null,
      };

      // Upsert grading — find by strategyId
      const existingGrade = await prisma.strategyGrade.findUnique({
        where: { strategyId: s.id as string },
      });
      if (existingGrade) {
        await prisma.strategyGrade.update({
          where: { strategyId: s.id as string },
          data: gradeData,
        });
      } else {
        await prisma.strategyGrade.create({
          data: { strategyId: s.id as string, ...gradeData },
        });
      }
    }
  }

  console.log("✅ Seed complete.");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
