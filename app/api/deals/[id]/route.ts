/**
 * GET    /api/deals/:id   — Get a single deal
 * PATCH  /api/deals/:id   — Update deal fields
 * DELETE /api/deals/:id   — Delete a deal
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadDealById } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import {
  stageToDb,
  readinessToDb,
  constraintToDb,
  gateStatusToDb,
  artefactStatusToDb,
} from "@/lib/db/enum-maps";
import type { Deal } from "@/lib/types";
import { IdParamSchema, PatchDealSchema } from "@/lib/validations";
import {
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
  requireAuthOrResponse,
} from "@/lib/api-guards";
import {
  RATE_LIMITS,
  RATE_LIMIT_WINDOW_MS,
  MAX_BODY_BYTES,
} from "@/lib/api-constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const idError = validateIdParam(id, "deal id");
    if (idError) return idError;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "deal-read",
      RATE_LIMITS.read,
      RATE_LIMIT_WINDOW_MS,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const deal = await loadDealById(id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    return NextResponse.json(deal, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    logger.error("GET /api/deals/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to load deal" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const idError = validateIdParam(id, "deal id");
    if (idError) return idError;

    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "deal-update",
      30,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await readJsonWithLimitOrResponse<unknown>(
      request,
      MAX_BODY_BYTES.standard,
    );
    if ("response" in parsedBody) return parsedBody.response;
    const parsed = PatchDealSchema.safeParse(parsedBody.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Check deal exists
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.stage !== undefined)
      updateData.stage = stageToDb(body.stage as Deal["stage"]);
    if (body.readinessState !== undefined)
      updateData.readinessState = readinessToDb(body.readinessState as Deal["readinessState"]);
    if (body.dominantConstraint !== undefined)
      updateData.dominantConstraint = constraintToDb(body.dominantConstraint as Deal["dominantConstraint"]);
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.nextStep !== undefined) updateData.nextStep = body.nextStep;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.investmentValueAmount !== undefined) updateData.investmentValueAmount = body.investmentValueAmount;
    if (body.investmentValueDescription !== undefined) updateData.investmentValueDescription = body.investmentValueDescription;
    if (body.economicImpactAmount !== undefined) updateData.economicImpactAmount = body.economicImpactAmount;
    if (body.economicImpactDescription !== undefined) updateData.economicImpactDescription = body.economicImpactDescription;
    if (body.economicImpactJobs !== undefined) updateData.economicImpactJobs = body.economicImpactJobs;
    if (body.keyStakeholders !== undefined) updateData.keyStakeholders = body.keyStakeholders;
    if (body.risks !== undefined) updateData.risks = body.risks;
    if (body.strategicActions !== undefined) updateData.strategicActions = body.strategicActions;
    if (body.infrastructureNeeds !== undefined) updateData.infrastructureNeeds = body.infrastructureNeeds;
    if (body.skillsImplications !== undefined) updateData.skillsImplications = body.skillsImplications || null;
    if (body.marketDrivers !== undefined) updateData.marketDrivers = body.marketDrivers || null;

    await prisma.deal.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.deal.update>[0]["data"],
    });

    // Log constraint change if applicable
    if (body.dominantConstraint !== undefined && body.changeReason) {
      await prisma.constraintEvent.create({
        data: {
          entityType: "deal",
          entityId: id,
          dominantConstraint: constraintToDb(body.dominantConstraint as Deal["dominantConstraint"]),
          changeReason: body.changeReason,
        },
      });
    }

    // Replace gate checklist if provided
    if (body.gateChecklist) {
      await prisma.dealGateEntry.deleteMany({ where: { dealId: id } });
      const checklist = body.gateChecklist as Record<string, { question: string; status: string }[]>;
      const entries = Object.entries(checklist).flatMap(
        ([stage, items]) =>
          items.map((item) => ({
            dealId: id,
            stage: stageToDb(stage as Deal["stage"]),
            question: item.question,
            status: gateStatusToDb(item.status as "pending" | "satisfied" | "not-applicable"),
          }))
      );
      if (entries.length > 0) {
        await prisma.dealGateEntry.createMany({ data: entries });
      }
    }

    // Replace artefacts if provided
    if (body.artefacts) {
      await prisma.dealArtefact.deleteMany({ where: { dealId: id } });
      const artefactMap = body.artefacts as Record<string, { name: string; status: string; summary?: string; url?: string }[]>;
      const entries = Object.entries(artefactMap).flatMap(
        ([stage, items]) =>
          items.map((item) => ({
            dealId: id,
            stage: stageToDb(stage as Deal["stage"]),
            name: item.name,
            status: artefactStatusToDb(item.status as "not-started" | "in-progress" | "complete"),
            summary: item.summary ?? null,
            url: item.url ?? null,
          }))
      );
      if (entries.length > 0) {
        await prisma.dealArtefact.createMany({ data: entries });
      }
    }

    // Return updated deal
    const updated = await loadDealById(id);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error("PATCH /api/deals/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const idError = validateIdParam(id, "deal id");
    if (idError) return idError;

    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "deal-delete",
      20,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error("DELETE /api/deals/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}

function validateIdParam(value: string, label: string) {
  const parsed = IdParamSchema.safeParse(value);
  if (!parsed.success) {
    return NextResponse.json({ error: `Invalid ${label}` }, { status: 400 });
  }
  return null;
}
