/**
 * GET  /api/deals         — List all deals
 * POST /api/deals         — Create a new deal
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadDeals } from "@/lib/db/queries";
import {
  stageToDb,
  readinessToDb,
  constraintToDb,
  gateStatusToDb,
  artefactStatusToDb,
} from "@/lib/db/enum-maps";
import type { Deal } from "@/lib/types";

export async function GET() {
  try {
    const deals = await loadDeals();
    return NextResponse.json(deals);
  } catch (error) {
    console.error("GET /api/deals error:", error);
    return NextResponse.json(
      { error: "Failed to load deals" },
      { status: 500 }
    );
  }
}

/** Shape of the request body for creating a deal. */
interface CreateDealBody {
  name: string;
  opportunityTypeId: string;
  lgaIds?: string[];
  lat?: number;
  lng?: number;
  stage: string;
  readinessState: string;
  dominantConstraint: string;
  summary: string;
  nextStep?: string;
  description?: string;
  investmentValue?: string;
  investmentValueAmount?: number;
  investmentValueDescription?: string;
  economicImpact?: string;
  economicImpactAmount?: number;
  economicImpactDescription?: string;
  economicImpactJobs?: number;
  keyStakeholders?: string[];
  risks?: string[];
  strategicActions?: string[];
  infrastructureNeeds?: string[];
  skillsImplications?: string;
  marketDrivers?: string;
  governmentPrograms?: { name: string; description?: string }[];
  timeline?: { label: string; date?: string }[];
  evidence?: { label?: string; url?: string; pageRef?: string }[];
  gateChecklist?: Record<string, { question: string; status: string }[]>;
  artefacts?: Record<string, { name: string; status: string }[]>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateDealBody;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Deal name is required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        name: body.name.trim(),
        opportunityTypeId: body.opportunityTypeId,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        stage: stageToDb(body.stage as Deal["stage"]) as never,
        readinessState: readinessToDb(body.readinessState as Deal["readinessState"]) as never,
        dominantConstraint: constraintToDb(body.dominantConstraint as Deal["dominantConstraint"]) as never,
        summary: body.summary,
        nextStep: body.nextStep ?? "",
        description: body.description ?? null,
        investmentValueAmount: typeof body.investmentValueAmount === "number" ? body.investmentValueAmount : 0,
        investmentValueDescription: body.investmentValueDescription ?? body.investmentValue ?? "",
        economicImpactAmount: typeof body.economicImpactAmount === "number" ? body.economicImpactAmount : 0,
        economicImpactDescription: body.economicImpactDescription ?? body.economicImpact ?? "",
        economicImpactJobs: typeof body.economicImpactJobs === "number" ? body.economicImpactJobs : null,
        keyStakeholders: body.keyStakeholders ?? [],
        risks: body.risks ?? [],
        strategicActions: body.strategicActions ?? [],
        infrastructureNeeds: body.infrastructureNeeds ?? [],
        skillsImplications: body.skillsImplications ?? null,
        marketDrivers: body.marketDrivers ?? null,
        lgas: body.lgaIds
          ? {
              create: body.lgaIds.map((lgaId) => ({ lgaId })),
            }
          : undefined,
        evidence: body.evidence
          ? {
              create: body.evidence.map((e) => ({
                label: e.label ?? null,
                url: e.url ?? null,
                pageRef: e.pageRef ?? null,
              })),
            }
          : undefined,
        governmentPrograms: body.governmentPrograms
          ? {
              create: body.governmentPrograms.map((gp) => ({
                name: gp.name,
                description: gp.description ?? null,
              })),
            }
          : undefined,
        timeline: body.timeline
          ? {
              create: body.timeline.map((t) => ({
                label: t.label,
                date: t.date ?? null,
              })),
            }
          : undefined,
        gateChecklist: body.gateChecklist
          ? {
              create: Object.entries(body.gateChecklist).flatMap(
                ([stage, entries]) =>
                  entries.map((e) => ({
                    stage: stageToDb(stage as Deal["stage"]) as never,
                    question: e.question,
                    status: gateStatusToDb(e.status as "pending" | "satisfied" | "not-applicable") as never,
                  }))
              ),
            }
          : undefined,
        artefacts: body.artefacts
          ? {
              create: Object.entries(body.artefacts).flatMap(
                ([stage, entries]) =>
                  entries.map((e) => ({
                    stage: stageToDb(stage as Deal["stage"]) as never,
                    name: e.name,
                    status: artefactStatusToDb(e.status as "not-started" | "in-progress" | "complete") as never,
                  }))
              ),
            }
          : undefined,
      },
    });

    return NextResponse.json({ id: deal.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/deals error:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
