/**
 * GET  /api/opportunity-types   — List all opportunity types
 * POST /api/opportunity-types   — Create a new opportunity type
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadOpportunityTypes } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { CreateOpportunityTypeSchema } from "@/lib/validations";
import {
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
  requireAuthOrResponse,
} from "@/lib/api-guards";

export async function GET() {
  try {
    const types = await loadOpportunityTypes();
    return NextResponse.json(types);
  } catch (error) {
    logger.error("GET /api/opportunity-types failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load opportunity types" },
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
      "opportunity-type-create",
      20,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await readJsonWithLimitOrResponse<unknown>(
      request,
      131_072,
    );
    if ("response" in parsedBody) return parsedBody.response;

    const parsed = CreateOpportunityTypeSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const id =
      body.id ||
      body.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const ot = await prisma.opportunityType.create({
      data: {
        id,
        name: body.name.trim(),
        definition: body.definition ?? "",
        economicFunction: body.economicFunction ?? "",
        typicalCapitalStack: body.typicalCapitalStack ?? "",
        typicalRisks: body.typicalRisks ?? "",
      },
    });

    return NextResponse.json(
      {
        id: ot.id,
        name: ot.name,
        definition: ot.definition,
        economicFunction: ot.economicFunction,
        typicalCapitalStack: ot.typicalCapitalStack,
        typicalRisks: ot.typicalRisks,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("POST /api/opportunity-types failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create opportunity type" },
      { status: 500 }
    );
  }
}
