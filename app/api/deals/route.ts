/**
 * GET  /api/deals         — List all deals
 * POST /api/deals         — Create a new deal
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadDeals } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import {
  stageToDb,
  readinessToDb,
  constraintToDb,
  gateStatusToDb,
  artefactStatusToDb,
} from "@/lib/db/enum-maps";
import type { Deal } from "@/lib/types";
import { CreateDealSchema } from "@/lib/validations";
import {
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
  requireAuthOrResponse,
} from "@/lib/api-guards";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const parsedOffset = offsetParam ? Number.parseInt(offsetParam, 10) : undefined;
    let limit: number | undefined;
    let offset: number | undefined;
    if (parsedLimit !== undefined && Number.isFinite(parsedLimit)) {
      limit = Math.min(Math.max(parsedLimit, 1), 200);
    }
    if (parsedOffset !== undefined && Number.isFinite(parsedOffset)) {
      offset = Math.max(parsedOffset, 0);
    }

    const deals = await loadDeals({ limit, offset });

    if (limit !== undefined || offset !== undefined) {
      const total = await prisma.deal.count();
      return NextResponse.json({
        items: deals,
        total,
        limit: limit ?? null,
        offset: offset ?? 0,
      });
    }

    return NextResponse.json(deals);
  } catch (error) {
    logger.error("GET /api/deals failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load deals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "deal-create",
      30,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await readJsonWithLimitOrResponse<unknown>(
      request,
      262_144,
    );
    if ("response" in parsedBody) return parsedBody.response;

    const raw = parsedBody.data;
    const parsed = CreateDealSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

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
              create: Object.entries(
                body.gateChecklist as Record<string, { question: string; status: string }[]>,
              ).flatMap(([stage, entries]) =>
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
              create: Object.entries(
                body.artefacts as Record<string, { name: string; status: string }[]>,
              ).flatMap(([stage, entries]) =>
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
    logger.error("POST /api/deals failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
