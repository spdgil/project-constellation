/**
 * POST /api/strategies/:id/grade
 *
 * Reads the strategy's blueprint components and produces a StrategyGrade
 * via GPT-4o, aligned to REFERENCE_STRATEGY_GRADING_SYSTEM.md.
 * See prompts/sector_strategy_grading.md for the prompt template.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

import { prisma } from "@/lib/db/prisma";
import { loadStrategyById } from "@/lib/db/queries";
import { gradeLetterToDb } from "@/lib/db/enum-maps";
import type {
  GradeLetter,
  StrategyComponentId,
  StrategyGradeMissingElement,
} from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

/** JSON shape returned by the LLM. */
interface GradingLLMResponse {
  grade_letter: string;
  grade_rationale_short: string;
  evidence_notes_by_component: Record<string, string>;
  missing_elements: Array<{ component_id: string; reason: string }>;
  scope_discipline_notes: string;
}

/** Response returned to the client. */
export interface StrategyGradeResult {
  id: string;
  strategyId: string;
  gradeLetter: GradeLetter;
  gradeRationaleShort: string;
  evidenceNotesByComponent: Partial<Record<StrategyComponentId, string>>;
  missingElements: StrategyGradeMissingElement[];
  scopeDisciplineNotes?: string;
  /** Warnings about fields that used fallback defaults due to missing/malformed AI output. */
  warnings: string[];
}

// =============================================================================
// OpenAI client — lazy initialisation (same pattern as extract route)
// =============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// =============================================================================
// Prompts — aligned with prompts/sector_strategy_grading.md
// =============================================================================

function buildSystemPrompt(): string {
  return `You are an expert evaluator of sector development strategies. Your task is to grade a strategy against the six-component blueprint for sector development.

## Grading Scale

Assign ONE grade letter from the following scale:

- **A** — Comprehensive: all six components are explicitly and thoroughly addressed with strong empirical evidence, clear logic, and operational detail.
- **A-** — Strong: most components are explicitly addressed with good evidence and logic; minor gaps in one or two components that do not undermine the overall coherence.
- **B** — Solid: the majority of components are addressed with adequate evidence; some components may be implicit or underdeveloped but the strategy is functional.
- **B-** — Adequate: core components are present but several have limited depth; the strategy covers the basics but lacks rigour in places.
- **C** — Partial: significant gaps in two or more components; the strategy addresses some aspects well but is incomplete as a framework.
- **D** — Weak: most components are poorly addressed or absent; the strategy lacks coherence and analytical depth.
- **F** — Insufficient: the document does not function as a sector development strategy; most components are missing or superficial.

## Blueprint Components

The six components you must evaluate:

1. **Sector Diagnostics and Comparative Advantage** — Empirical baseline, sector identification logic, adjacency and growth analysis, justification for sector focus.
2. **Economic Geography and Places of Production** — Places, regions, industrial precincts, enabling infrastructure linked to sector activity.
3. **Regulatory and Enabling Environment** — Policy frameworks, planning barriers, regulatory reform pathways, enabling conditions.
4. **Value Chain and Market Integration** — Demand drivers, supply chain positioning, market access, value chain mapping.
5. **Workforce and Skills Alignment** — Skills gaps, training alignment, transferability, workforce development.
6. **Sector Culture and Norms** — Cultural factors, behavioural norms, innovation disposition, collaboration readiness.

## Your Evaluation Must Include

1. **grade_letter** — One of: A, A-, B, B-, C, D, F
2. **grade_rationale_short** — A concise 2–3 sentence rationale for the grade.
3. **evidence_notes_by_component** — For each component (keyed "1" through "6"), a 1–2 sentence assessment of how well the strategy addresses it.
4. **missing_elements** — An array of objects identifying specific gaps: each has a "component_id" (string "1"–"6") and a "reason" explaining what is missing. Only include genuinely missing or weak elements; an empty array is valid for strong strategies.
5. **scope_discipline_notes** — A 1–2 sentence note on whether the strategy stays within appropriate scope (does not overclaim delivery, capital allocation, or outcomes it cannot control).

## Scope Discipline

A well-graded strategy should:
- Position actions as enabling rather than delivering
- Not overclaim capital allocation or market outcomes
- Acknowledge boundaries of influence
- Focus on coordination, facilitation, and capability building

## Output Format

Respond ONLY with a valid JSON object. No markdown fences, no additional text.
The JSON must match this exact schema:

{
  "grade_letter": "<A | A- | B | B- | C | D | F>",
  "grade_rationale_short": "<2–3 sentence rationale>",
  "evidence_notes_by_component": {
    "1": "<assessment of component 1>",
    "2": "<assessment of component 2>",
    "3": "<assessment of component 3>",
    "4": "<assessment of component 4>",
    "5": "<assessment of component 5>",
    "6": "<assessment of component 6>"
  },
  "missing_elements": [
    { "component_id": "<1–6>", "reason": "<what is missing>" }
  ],
  "scope_discipline_notes": "<1–2 sentence scope assessment>"
}

IMPORTANT:
- Use ONLY the exact grade letters listed above.
- Every component (1–6) MUST have an evidence note, even if the note says the component was not addressed.
- missing_elements may be empty ([]) if no significant gaps exist.
- Be rigorous but fair. Grade based on what the strategy actually contains, not what you think it should contain.`;
}

function buildUserPrompt(strategy: {
  title: string;
  summary: string;
  components: Record<StrategyComponentId, string>;
  selectionLogic?: {
    adjacentDefinition?: string | null;
    growthDefinition?: string | null;
    criteria: string[];
  } | null;
  crossCuttingThemes: string[];
  stakeholderCategories: string[];
}): string {
  const c = strategy.components;
  const sl = strategy.selectionLogic;

  return `Grade the following sector development strategy against the six-component blueprint.

The strategy's extracted blueprint components are provided below. Evaluate each component and produce a grade.

STRATEGY TITLE: ${strategy.title}

STRATEGY SUMMARY: ${strategy.summary}

COMPONENT 1 — Sector Diagnostics and Comparative Advantage:
${c["1"] || "(Not provided)"}

COMPONENT 2 — Economic Geography and Places of Production:
${c["2"] || "(Not provided)"}

COMPONENT 3 — Regulatory and Enabling Environment:
${c["3"] || "(Not provided)"}

COMPONENT 4 — Value Chain and Market Integration:
${c["4"] || "(Not provided)"}

COMPONENT 5 — Workforce and Skills Alignment:
${c["5"] || "(Not provided)"}

COMPONENT 6 — Sector Culture and Norms:
${c["6"] || "(Not provided)"}

SELECTION LOGIC:
Adjacent definition: ${sl?.adjacentDefinition ?? "(Not provided)"}
Growth definition: ${sl?.growthDefinition ?? "(Not provided)"}
Criteria: ${sl?.criteria?.length ? sl.criteria.join(", ") : "(Not provided)"}

CROSS-CUTTING THEMES: ${strategy.crossCuttingThemes.length ? strategy.crossCuttingThemes.join(", ") : "(Not provided)"}

STAKEHOLDER CATEGORIES: ${strategy.stakeholderCategories.length ? strategy.stakeholderCategories.join(", ") : "(Not provided)"}`;
}

// =============================================================================
// Validation helpers
// =============================================================================

const VALID_GRADES = new Set<string>(["A", "A-", "B", "B-", "C", "D", "F"]);
const COMPONENT_IDS: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];

function validateGradingResponse(
  parsed: Record<string, unknown>,
): GradingLLMResponse & { warnings: string[] } {
  const warnings: string[] = [];

  // Grade letter
  const rawGrade =
    typeof parsed.grade_letter === "string" ? parsed.grade_letter.trim() : "";
  let gradeLetter: string;
  if (VALID_GRADES.has(rawGrade)) {
    gradeLetter = rawGrade;
  } else {
    gradeLetter = "C";
    warnings.push(
      rawGrade
        ? `AI returned invalid grade '${rawGrade}' — defaulted to 'C'.`
        : "AI did not return a grade letter — defaulted to 'C'.",
    );
  }

  // Rationale
  const gradeRationaleShort =
    typeof parsed.grade_rationale_short === "string"
      ? parsed.grade_rationale_short
      : "No rationale provided.";
  if (typeof parsed.grade_rationale_short !== "string") {
    warnings.push("AI did not return a grade rationale — using placeholder.");
  }

  // Evidence notes
  const evidenceRaw =
    typeof parsed.evidence_notes_by_component === "object" &&
    parsed.evidence_notes_by_component !== null
      ? (parsed.evidence_notes_by_component as Record<string, unknown>)
      : {};

  if (typeof parsed.evidence_notes_by_component !== "object" || parsed.evidence_notes_by_component === null) {
    warnings.push("AI response missing 'evidence_notes_by_component' — all evidence defaulted.");
  }

  const evidenceNotesByComponent: Record<string, string> = {};
  for (const cid of COMPONENT_IDS) {
    if (typeof evidenceRaw[cid] === "string") {
      evidenceNotesByComponent[cid] = evidenceRaw[cid] as string;
    } else {
      evidenceNotesByComponent[cid] = "No assessment provided.";
      if (typeof parsed.evidence_notes_by_component === "object" && parsed.evidence_notes_by_component !== null) {
        warnings.push(`Evidence for component ${cid} was missing — using placeholder.`);
      }
    }
  }

  // Missing elements
  let missingElements: Array<{ component_id: string; reason: string }> = [];
  if (Array.isArray(parsed.missing_elements)) {
    missingElements = parsed.missing_elements
      .filter(
        (el): el is { component_id: string; reason: string } =>
          typeof el === "object" &&
          el !== null &&
          typeof (el as Record<string, unknown>).component_id === "string" &&
          typeof (el as Record<string, unknown>).reason === "string",
      )
      .map((el) => ({
        component_id: String(el.component_id),
        reason: String(el.reason),
      }));
  }

  // Scope discipline
  const scopeDisciplineNotes =
    typeof parsed.scope_discipline_notes === "string"
      ? parsed.scope_discipline_notes
      : "";
  if (typeof parsed.scope_discipline_notes !== "string") {
    warnings.push("AI did not return scope discipline notes.");
  }

  return {
    grade_letter: gradeLetter,
    grade_rationale_short: gradeRationaleShort,
    evidence_notes_by_component: evidenceNotesByComponent,
    missing_elements: missingElements,
    scope_discipline_notes: scopeDisciplineNotes,
    warnings,
  };
}

// =============================================================================
// Route handler
// =============================================================================

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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
    const missingElements: StrategyGradeMissingElement[] =
      grading.missing_elements.map((el) => ({
        componentId: el.component_id as StrategyComponentId,
        reason: el.reason,
      }));

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

    console.error(`[strategy-grade] Error for strategy ${id}:`, error);
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
