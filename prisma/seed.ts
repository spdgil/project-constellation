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
    await prisma.deal.upsert({
      where: { id: d.id as string },
      update: {},
      create: {
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
        investmentValue: (d.investmentValue as string) ?? null,
        economicImpact: (d.economicImpact as string) ?? null,
        keyStakeholders: (d.keyStakeholders as string[]) ?? [],
        risks: (d.risks as string[]) ?? [],
        strategicActions: (d.strategicActions as string[]) ?? [],
        infrastructureNeeds: (d.infrastructureNeeds as string[]) ?? [],
        skillsImplications: (d.skillsImplications as string) ?? null,
        marketDrivers: (d.marketDrivers as string) ?? null,
        updatedAt: new Date(d.updatedAt as string),
      },
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

  console.log("✅ Seed complete.");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
