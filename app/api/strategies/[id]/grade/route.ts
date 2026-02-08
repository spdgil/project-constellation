/**
 * POST /api/strategies/:id/grade
 *
 * Reads the strategy's blueprint components and produces a StrategyGrade
 * via GPT-4o, aligned to REFERENCE_STRATEGY_GRADING_SYSTEM.md.
 * See prompts/sector_strategy_grading.md for the prompt template.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { loadStrategyById } from "@/lib/db/queries";
import { gradeLetterToDb } from "@/lib/db/enum-maps";
import type { StrategyGradeResult } from "@/lib/ai/types";
import {
  buildStrategyGradeSystemPrompt,
  buildStrategyGradeUserPrompt,
  parseStrategyGradeResponse,
} from "@/lib/ai/strategy-grade";
import type { GradeLetter, StrategyComponentId } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

export type { StrategyGradeResult } from "@/lib/ai/types";

const COMPONENT_IDS: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];

// =============================================================================
// OpenAI client — lazy initialisation (same pattern as extract route)
// =============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// =============================================================================
// Prompts — aligned with prompts/sector_strategy_grading.md
// =============================================================================

function buildSystemPrompt(): string {
  return buildStrategyGradeSystemPrompt();
}

function buildUserPrompt(strategy: {
  title: string;
  summary: string;
  components: Record<StrategyComponentId, string>;
  selectionLogic?: {
    adjacentDefinition?: string | null;
    growthDefinition?: string | null;
    criteria?: string[];
  } | null;
  crossCuttingThemes: string[];
  stakeholderCategories: string[];
}): string {
  const selectionLogic = strategy.selectionLogic
    ? {
        adjacentDefinition: strategy.selectionLogic.adjacentDefinition ?? undefined,
        growthDefinition: strategy.selectionLogic.growthDefinition ?? undefined,
        criteria: strategy.selectionLogic.criteria ?? undefined,
      }
    : undefined;

  return buildStrategyGradeUserPrompt({
    title: strategy.title,
    components: strategy.components,
    selectionLogic,
    crossCuttingThemes: strategy.crossCuttingThemes,
    stakeholderCategories: strategy.stakeholderCategories,
  });
}

// =============================================================================
// Validation helpers
// =============================================================================

function validateGradingResponse(
  parsed: Record<string, unknown>,
): ReturnType<typeof parseStrategyGradeResponse> {
  return parseStrategyGradeResponse(parsed);
}

// =============================================================================
// Route handler
// =============================================================================

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  // Rate limit: 10 requests per minute per IP
  const rlKey = rateLimitKeyFromRequest(_request);
  const rl = await checkRateLimit(`strategy-grade:${rlKey}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  const { id } = await context.params;

  try {
    // 1. Load the strategy
    const strategy = await loadStrategyById(id);
    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 },
      );
    }

    // 2. Validate that at least some components exist
    const hasContent = COMPONENT_IDS.some(
      (cid) => strategy.components[cid]?.trim(),
    );
    if (!hasContent) {
      return NextResponse.json(
        {
          error:
            "Strategy has no blueprint components to grade. Run AI extraction first.",
        },
        { status: 400 },
      );
    }

    // 3. Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(strategy);

    // 4. Call GPT-4o
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // 5. Parse JSON response
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI grading response. Please try again." },
        { status: 502 },
      );
    }

    // 6. Validate
    const grading = validateGradingResponse(parsed);

    // 7. Map missing elements to frontend type
    const missingElements = grading.missing_elements;

    // 8. Upsert the StrategyGrade record
    const dbGradeLetter = gradeLetterToDb(grading.grade_letter as GradeLetter);

    const gradeRecord = await prisma.strategyGrade.upsert({
      where: { strategyId: id },
      update: {
        gradeLetter: dbGradeLetter as never,
        gradeRationaleShort: grading.grade_rationale_short,
        evidenceComp1: grading.evidence_notes_by_component["1"] ?? null,
        evidenceComp2: grading.evidence_notes_by_component["2"] ?? null,
        evidenceComp3: grading.evidence_notes_by_component["3"] ?? null,
        evidenceComp4: grading.evidence_notes_by_component["4"] ?? null,
        evidenceComp5: grading.evidence_notes_by_component["5"] ?? null,
        evidenceComp6: grading.evidence_notes_by_component["6"] ?? null,
        missingElements: JSON.stringify(missingElements),
        scopeDisciplineNotes: grading.scope_discipline_notes || null,
      },
      create: {
        strategyId: id,
        gradeLetter: dbGradeLetter as never,
        gradeRationaleShort: grading.grade_rationale_short,
        evidenceComp1: grading.evidence_notes_by_component["1"] ?? null,
        evidenceComp2: grading.evidence_notes_by_component["2"] ?? null,
        evidenceComp3: grading.evidence_notes_by_component["3"] ?? null,
        evidenceComp4: grading.evidence_notes_by_component["4"] ?? null,
        evidenceComp5: grading.evidence_notes_by_component["5"] ?? null,
        evidenceComp6: grading.evidence_notes_by_component["6"] ?? null,
        missingElements: JSON.stringify(missingElements),
        scopeDisciplineNotes: grading.scope_discipline_notes || null,
      },
    });

    // 9. Build response
    const result: StrategyGradeResult = {
      id: gradeRecord.id,
      strategyId: id,
      gradeLetter: grading.grade_letter as GradeLetter,
      gradeRationaleShort: grading.grade_rationale_short,
      evidenceNotesByComponent: grading.evidence_notes_by_component as Partial<
        Record<StrategyComponentId, string>
      >,
      missingElements,
      scopeDisciplineNotes: grading.scope_discipline_notes || undefined,
      warnings: grading.warnings,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error:
              "Rate limit exceeded. Please wait a moment and try again.",
          },
          { status: 429 },
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "API configuration error. Check your OPENAI_API_KEY.",
          },
          { status: 500 },
        );
      }
    }

    logger.error("Strategy grading failed", { strategyId: id, error: String(error) });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      },
      { status: 500 },
    );
  }
}
