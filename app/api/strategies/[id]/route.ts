/**
 * GET    /api/strategies/:id  — Get a single strategy
 * PATCH  /api/strategies/:id  — Update strategy fields (draft save or finalise)
 * DELETE /api/strategies/:id  — Delete a strategy
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadStrategyById } from "@/lib/db/queries";

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
    console.error(`GET /api/strategies/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to load strategy" },
      { status: 500 },
    );
  }
}

/** Fields that can be updated via PATCH. */
interface PatchStrategyBody {
  title?: string;
  summary?: string;
  sourceDocument?: string;
  status?: "draft" | "published";
  // Blueprint components (keyed "1"–"6")
  components?: Record<string, string>;
  // Selection logic
  selectionLogic?: {
    adjacentDefinition?: string | null;
    growthDefinition?: string | null;
    criteria?: string[];
  };
  crossCuttingThemes?: string[];
  stakeholderCategories?: string[];
  /** Linked sector opportunity IDs (replaces all existing links). */
  prioritySectorIds?: string[];
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await prisma.sectorDevelopmentStrategy.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as PatchStrategyBody;
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

    // Update strategy fields
    if (Object.keys(data).length > 0) {
      await prisma.sectorDevelopmentStrategy.update({
        where: { id },
        data,
      });
    }

    // Update sector opportunity links (replace all)
    if (hasSectorLinks) {
      const sectorIds = body.prioritySectorIds!;

      // Delete existing links
      await prisma.strategySectorOpportunity.deleteMany({
        where: { strategyId: id },
      });

      // Re-create with sort order
      for (let i = 0; i < sectorIds.length; i++) {
        await prisma.strategySectorOpportunity.create({
          data: {
            strategyId: id,
            sectorOpportunityId: sectorIds[i],
            sortOrder: i,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`PATCH /api/strategies/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
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
    console.error(`DELETE /api/strategies/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 },
    );
  }
}
