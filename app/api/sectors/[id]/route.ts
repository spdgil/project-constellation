/**
 * API routes for a single sector opportunity.
 *
 * GET  /api/sectors/:id  — fetch one sector opportunity
 * PATCH /api/sectors/:id — update sector opportunity fields
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { PatchSectorSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

type Ctx = { params: Promise<{ id: string }> };

/* ------------------------------------------------------------------ */
/* GET                                                                 */
/* ------------------------------------------------------------------ */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const row = await prisma.sectorOpportunity.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    logger.error("GET /api/sectors/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to load sector opportunity" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH                                                               */
/* ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const raw = await req.json();
    const parsed = PatchSectorSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const body = parsed.data;

    // Build the data payload from validated fields
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.version !== undefined) data.version = body.version;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.sources !== undefined) data.sources = body.sources;

    // Sections 1–10
    if (body.sections) {
      for (let i = 1; i <= 10; i++) {
        const key = `section${i}` as const;
        if (typeof body.sections[String(i)] === "string") {
          data[key] = body.sections[String(i)];
        }
      }
    }

    const updated = await prisma.sectorOpportunity.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("PATCH /api/sectors/:id failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to update sector opportunity" },
      { status: 500 },
    );
  }
}
