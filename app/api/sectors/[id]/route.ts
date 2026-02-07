/**
 * API routes for a single sector opportunity.
 *
 * GET  /api/sectors/:id  — fetch one sector opportunity
 * PATCH /api/sectors/:id — update sector opportunity fields
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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
    console.error(`GET /api/sectors/${id} error:`, error);
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
    const body = await req.json();

    // Build the data payload from accepted fields
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.version === "string") data.version = body.version;
    if (Array.isArray(body.tags)) data.tags = body.tags;
    if (Array.isArray(body.sources)) data.sources = body.sources;

    // Sections 1–10
    for (let i = 1; i <= 10; i++) {
      const key = `section${i}` as const;
      if (typeof body.sections?.[String(i)] === "string") {
        data[key] = body.sections[String(i)];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    const updated = await prisma.sectorOpportunity.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/sectors/${id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update sector opportunity" },
      { status: 500 },
    );
  }
}
