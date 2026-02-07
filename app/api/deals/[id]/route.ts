/**
 * GET    /api/deals/:id   — Get a single deal
 * PATCH  /api/deals/:id   — Update deal fields
 * DELETE /api/deals/:id   — Delete a deal
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadDealById } from "@/lib/db/queries";
import {
  stageToDb,
  readinessToDb,
  constraintToDb,
  gateStatusToDb,
  artefactStatusToDb,
} from "@/lib/db/enum-maps";
import type { Deal } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const deal = await loadDealById(id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    return NextResponse.json(deal);
  } catch (error) {
    console.error(`GET /api/deals/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to load deal" },
      { status: 500 }
    );
  }
}

/** Partial update body — only the fields being changed. */
interface PatchDealBody {
  name?: string;
  stage?: string;
  readinessState?: string;
  dominantConstraint?: string;
  changeReason?: string; // For constraint change audit
  summary?: string;
  nextStep?: string;
  description?: string;
  investmentValueAmount?: number;
  investmentValueDescription?: string;
  economicImpactAmount?: number;
  economicImpactDescription?: string;
  economicImpactJobs?: number | null;
  keyStakeholders?: string[];
  risks?: string[];
  strategicActions?: string[];
  infrastructureNeeds?: string[];
  skillsImplications?: string;
  marketDrivers?: string;
  gateChecklist?: Record<string, { question: string; status: string }[]>;
  artefacts?: Record<string, { name: string; status: string; summary?: string; url?: string }[]>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as PatchDealBody;

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
      data: updateData as never,
    });

    // Log constraint change if applicable
    if (body.dominantConstraint !== undefined && body.changeReason) {
      await prisma.constraintEvent.create({
        data: {
          entityType: "deal",
          entityId: id,
          dominantConstraint: constraintToDb(body.dominantConstraint as Deal["dominantConstraint"]) as never,
          changeReason: body.changeReason,
        },
      });
    }

    // Replace gate checklist if provided
    if (body.gateChecklist) {
      await prisma.dealGateEntry.deleteMany({ where: { dealId: id } });
      const entries = Object.entries(body.gateChecklist).flatMap(
        ([stage, items]) =>
          items.map((item) => ({
            dealId: id,
            stage: stageToDb(stage as Deal["stage"]) as never,
            question: item.question,
            status: gateStatusToDb(item.status as "pending" | "satisfied" | "not-applicable") as never,
          }))
      );
      if (entries.length > 0) {
        await prisma.dealGateEntry.createMany({ data: entries as never });
      }
    }

    // Replace artefacts if provided
    if (body.artefacts) {
      await prisma.dealArtefact.deleteMany({ where: { dealId: id } });
      const entries = Object.entries(body.artefacts).flatMap(
        ([stage, items]) =>
          items.map((item) => ({
            dealId: id,
            stage: stageToDb(stage as Deal["stage"]) as never,
            name: item.name,
            status: artefactStatusToDb(item.status as "not-started" | "in-progress" | "complete") as never,
            summary: item.summary ?? null,
            url: item.url ?? null,
          }))
      );
      if (entries.length > 0) {
        await prisma.dealArtefact.createMany({ data: entries as never });
      }
    }

    // Return updated deal
    const updated = await loadDealById(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/deals/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(`DELETE /api/deals/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
