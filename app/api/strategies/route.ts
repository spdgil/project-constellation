/**
 * GET  /api/strategies         — List all strategies
 * POST /api/strategies         — Create a new draft strategy
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadStrategies } from "@/lib/db/queries";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
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

/** Shape of the request body for creating a draft strategy. */
interface CreateStrategyBody {
  title: string;
  sourceDocument?: string;
  summary?: string;
  extractedText?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateStrategyBody;

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Strategy title is required" },
        { status: 400 },
      );
    }

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
