/**
 * GET  /api/strategies         — List all strategies
 * POST /api/strategies         — Create a new draft strategy
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadStrategies } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { CreateStrategySchema } from "@/lib/validations";
import {
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
  requireAuthOrResponse,
} from "@/lib/api-guards";

/** List all sector development strategies. */
export async function GET(request: Request) {
  try {
    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "strategy-read",
      120,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const strategies = await loadStrategies();
    return NextResponse.json(strategies);
  } catch (error) {
    logger.error("GET /api/strategies failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load strategies" },
      { status: 500 },
    );
  }
}

/** Create a new draft strategy. */
export async function POST(request: Request) {
  try {
    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "strategy-create",
      20,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await readJsonWithLimitOrResponse<unknown>(
      request,
      262_144,
    );
    if ("response" in parsedBody) return parsedBody.response;

    const parsed = CreateStrategySchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const strategy = await prisma.sectorDevelopmentStrategy.create({
      data: {
        title: body.title.trim(),
        status: "draft",
        sourceDocument: body.sourceDocument ?? null,
        summary: body.summary?.trim() ?? "",
        extractedText: body.extractedText ?? null,
      },
    });

    return NextResponse.json({ id: strategy.id }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/strategies failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 },
    );
  }
}
