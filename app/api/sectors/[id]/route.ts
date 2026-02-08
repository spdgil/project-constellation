/**
 * API routes for a single sector opportunity.
 *
 * GET  /api/sectors/:id  — fetch one sector opportunity
 * PATCH /api/sectors/:id — update sector opportunity fields
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { IdParamSchema, PatchSectorSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import {
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
  requireAuthOrResponse,
} from "@/lib/api-guards";

type Ctx = { params: Promise<{ id: string }> };

/* ------------------------------------------------------------------ */
/* GET                                                                 */
/* ------------------------------------------------------------------ */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const idError = validateIdParam(id, "sector id");
    if (idError) return idError;

    const rateLimitResponse = await rateLimitOrResponse(
      _req,
      "sector-read",
      120,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

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
    const idError = validateIdParam(id, "sector id");
    if (idError) return idError;

    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      req,
      "sector-update",
      20,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await readJsonWithLimitOrResponse<unknown>(
      req,
      262_144,
    );
    if ("response" in parsedBody) return parsedBody.response;

    const parsed = PatchSectorSchema.safeParse(parsedBody.data);

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

function validateIdParam(value: string, label: string) {
  const parsed = IdParamSchema.safeParse(value);
  if (!parsed.success) {
    return NextResponse.json({ error: `Invalid ${label}` }, { status: 400 });
  }
  return null;
}
