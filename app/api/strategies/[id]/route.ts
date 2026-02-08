/**
 * GET    /api/strategies/:id  — Get a single strategy
 * PATCH  /api/strategies/:id  — Update strategy fields (draft save or finalise)
 * DELETE /api/strategies/:id  — Delete a strategy
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadStrategyById } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { PatchStrategySchema } from "@/lib/validations";
import {
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
  requireAuthOrResponse,
} from "@/lib/api-guards";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const strategy = await loadStrategyById(id);
    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(strategy);
  } catch (error) {
    logger.error("GET /api/strategies/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to load strategy" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "strategy-update",
      20,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const existing = await prisma.sectorDevelopmentStrategy.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 },
      );
    }

    const parsedBody = await readJsonWithLimitOrResponse<unknown>(
      request,
      262_144,
    );
    if ("response" in parsedBody) return parsedBody.response;

    const parsed = PatchStrategySchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.summary !== undefined) data.summary = body.summary.trim();
    if (body.sourceDocument !== undefined)
      data.sourceDocument = body.sourceDocument;
    if (body.status !== undefined) data.status = body.status;

    // Blueprint components
    if (body.components) {
      if (body.components["1"] !== undefined) data.component1 = body.components["1"];
      if (body.components["2"] !== undefined) data.component2 = body.components["2"];
      if (body.components["3"] !== undefined) data.component3 = body.components["3"];
      if (body.components["4"] !== undefined) data.component4 = body.components["4"];
      if (body.components["5"] !== undefined) data.component5 = body.components["5"];
      if (body.components["6"] !== undefined) data.component6 = body.components["6"];
    }

    // Selection logic
    if (body.selectionLogic) {
      if (body.selectionLogic.adjacentDefinition !== undefined)
        data.selectionLogicAdjacentDef = body.selectionLogic.adjacentDefinition;
      if (body.selectionLogic.growthDefinition !== undefined)
        data.selectionLogicGrowthDef = body.selectionLogic.growthDefinition;
      if (body.selectionLogic.criteria !== undefined)
        data.selectionCriteria = body.selectionLogic.criteria;
    }

    if (body.crossCuttingThemes !== undefined)
      data.crossCuttingThemes = body.crossCuttingThemes;
    if (body.stakeholderCategories !== undefined)
      data.stakeholderCategories = body.stakeholderCategories;

    const hasSectorLinks = body.prioritySectorIds !== undefined;

    if (Object.keys(data).length === 0 && !hasSectorLinks) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.sectorDevelopmentStrategy.update({
          where: { id },
          data,
        });
      }

      if (hasSectorLinks) {
        const sectorIds = body.prioritySectorIds!;
        await tx.strategySectorOpportunity.deleteMany({
          where: { strategyId: id },
        });
        if (sectorIds.length > 0) {
          await tx.strategySectorOpportunity.createMany({
            data: sectorIds.map((sectorId, index) => ({
              strategyId: id,
              sectorOpportunityId: sectorId,
              sortOrder: index,
            })),
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("PATCH /api/strategies/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      _req,
      "strategy-delete",
      10,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const existing = await prisma.sectorDevelopmentStrategy.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 },
      );
    }

    await prisma.sectorDevelopmentStrategy.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("DELETE /api/strategies/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 },
    );
  }
}
