/**
 * GET  /api/opportunity-types   — List all opportunity types
 * POST /api/opportunity-types   — Create a new opportunity type
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loadOpportunityTypes } from "@/lib/db/queries";
import { logger } from "@/lib/logger";

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

interface CreateOpportunityTypeBody {
  id?: string;
  name: string;
  definition?: string;
  economicFunction?: string;
  typicalCapitalStack?: string;
  typicalRisks?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOpportunityTypeBody;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

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
