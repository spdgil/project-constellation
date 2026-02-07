/**
 * POST /api/strategies/extract
 *
 * Accepts extracted strategy document text and returns structured fields
 * via GPT-4o, aligned to the 6-component blueprint.
 * See prompts/sector_strategy_extraction.md for the prompt template.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import type { StrategyComponentId } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

export interface StrategyExtractionRequest {
  /** Raw extracted text from the strategy document. */
  extractedText: string;
}

/** Per-component extraction with confidence and source citation. */
export interface ComponentExtraction {
  content: string;
  confidence: number;
  sourceExcerpt: string;
}

export interface StrategyExtractionResult {
  title: string;
  summary: string;
  components: Record<StrategyComponentId, ComponentExtraction>;
  selectionLogic: {
    adjacentDefinition: string | null;
    growthDefinition: string | null;
    criteria: string[];
  };
  crossCuttingThemes: string[];
  stakeholderCategories: string[];
  prioritySectorNames: string[];
  /** Warnings about fields that used fallback defaults due to missing/malformed AI output. */
  warnings: string[];
}

// =============================================================================
// OpenAI client — lazy initialisation (same pattern as analyse-memo)
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
// Prompts — aligned with prompts/sector_strategy_extraction.md
// =============================================================================

function buildSystemPrompt(): string {
  return `You are an expert economic development analyst specialising in sector development strategies.

Your task is to analyse the full text of a sector development strategy document and extract structured fields aligned to the six-component blueprint for sector development strategies.

## Blueprint Components

Every sector development strategy should address six core components:

1. **Sector Diagnostics and Comparative Advantage**
   Empirical baseline, sector identification logic, adjacency and growth analysis, and justification for sector focus.

2. **Economic Geography and Places of Production**
   Identification of places, regions, industrial precincts, and enabling infrastructure linked to sector activity.

3. **Regulatory and Enabling Environment**
   Policy frameworks, planning barriers, regulatory reform pathways, and enabling conditions analysis.

4. **Value Chain and Market Integration**
   Demand drivers, supply chain positioning, market access pathways, and non-transactional value chain mapping.

5. **Workforce and Skills Alignment**
   Skills gaps, training alignment, transferability of skills, and workforce development strategies.

6. **Sector Culture and Norms**
   Cultural factors, behavioural norms, innovation disposition, collaboration readiness, and sector identity.

## Selection Logic

Strategies typically define how priority sectors were chosen. Extract:
- **Adjacent sector definition**: what makes a sector "adjacent" to the existing capability base.
- **Growth sector definition**: what makes a sector a "growth" opportunity.
- **Selection criteria**: the multi-criteria analysis factors used (e.g. government_priority, size_scale_of_opportunity, sector_maturity_and_recent_growth, alignment_with_existing_skills_and_capability, stakeholder_interest_and_understanding).

## Cross-Cutting Themes

Strategies often identify recurring themes that cut across all sectors, e.g.:
- supporting_skills_development_and_transferability
- facilitating_partnerships_across_stakeholder_groups
- providing_insights_information_and_raising_awareness
- advocating_for_regulatory_and_policy_change

## Stakeholder Categories

Common categories: state_and_local_government, sector_businesses, adjacent_sector_organisations, resources_companies, industry_bodies, advisory_firms, educational_institutions.

## Priority Sectors

The strategy will usually name specific sector opportunities. Return their names as they appear in the document.

## Confidence

For each blueprint component, provide a confidence score from 0.0 to 1.0:
- **1.0** — The document explicitly and thoroughly addresses this component.
- **0.7–0.9** — The document addresses this component but with some gaps.
- **0.3–0.6** — The document only partially or implicitly addresses this component.
- **0.0–0.2** — The document barely mentions or does not address this component.

Also provide a brief source excerpt (1–2 sentences quoted or closely paraphrased from the document) to justify each component extraction.

## Output Format

Respond ONLY with a valid JSON object. No markdown fences, no additional text.
The JSON must match this exact schema:

{
  "title": "<strategy title as stated in the document>",
  "summary": "<concise 2–3 sentence summary of the strategy>",
  "components": {
    "1": { "content": "<extracted text for component 1>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "2": { "content": "<extracted text for component 2>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "3": { "content": "<extracted text for component 3>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "4": { "content": "<extracted text for component 4>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "5": { "content": "<extracted text for component 5>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "6": { "content": "<extracted text for component 6>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" }
  },
  "selectionLogic": {
    "adjacentDefinition": "<definition or null>",
    "growthDefinition": "<definition or null>",
    "criteria": ["<criterion_1>", "<criterion_2>"]
  },
  "crossCuttingThemes": ["<theme_1>", "<theme_2>"],
  "stakeholderCategories": ["<category_1>", "<category_2>"],
  "prioritySectorNames": ["<sector name 1>", "<sector name 2>"]
}

IMPORTANT:
- Use snake_case for selection criteria, cross-cutting themes, and stakeholder categories.
- For components, extract the substance — synthesise relevant content into a coherent paragraph.
- If a component is not addressed, set content to "" and confidence to 0.0.
- sourceExcerpt should be a short direct quote or close paraphrase from the document.`;
}

function buildUserPrompt(text: string): string {
  return `Analyse the following sector development strategy document and extract structured fields.

Return a JSON object matching the schema described in your instructions.

STRATEGY DOCUMENT:
${text}`;
}

// =============================================================================
// Validation helpers
// =============================================================================

const COMPONENT_IDS: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];

function validateComponent(value: unknown): ComponentExtraction {
  const fallback: ComponentExtraction = {
    content: "",
    confidence: 0,
    sourceExcerpt: "",
  };

  if (typeof value !== "object" || value === null) return fallback;
  const obj = value as Record<string, unknown>;

  return {
    content: typeof obj.content === "string" ? obj.content : "",
    confidence:
      typeof obj.confidence === "number"
        ? Math.max(0, Math.min(1, obj.confidence))
        : 0,
    sourceExcerpt:
      typeof obj.sourceExcerpt === "string" ? obj.sourceExcerpt : "",
  };
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

// =============================================================================
// Route handler
// =============================================================================

export async function POST(request: Request) {
  // Rate limit: 10 requests per minute per IP
  const rlKey = rateLimitKeyFromRequest(request);
  const rl = checkRateLimit(`strategy-extract:${rlKey}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const body = (await request.json()) as StrategyExtractionRequest;

    if (!body.extractedText || typeof body.extractedText !== "string") {
      return NextResponse.json(
        { error: "extractedText is required" },
        { status: 400 },
      );
    }

    // Truncate extremely long documents to stay within token limits
    const text =
      body.extractedText.length > 60_000
        ? body.extractedText.slice(0, 60_000) +
          "\n\n[Document truncated at 60,000 characters]"
        : body.extractedText;

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(text);

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // Parse JSON — handle potential markdown fences
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 },
      );
    }

    // Build validated result with warnings for fallback defaults
    const warnings: string[] = [];

    const componentsRaw =
      typeof parsed.components === "object" && parsed.components !== null
        ? (parsed.components as Record<string, unknown>)
        : {};

    if (typeof parsed.components !== "object" || parsed.components === null) {
      warnings.push("AI response missing 'components' object — all components defaulted to empty.");
    }

    const components = {} as Record<StrategyComponentId, ComponentExtraction>;
    for (const cid of COMPONENT_IDS) {
      components[cid] = validateComponent(componentsRaw[cid]);
      if (!componentsRaw[cid] || typeof componentsRaw[cid] !== "object") {
        warnings.push(`Component ${cid} was missing or malformed — defaulted to empty.`);
      } else if (!components[cid].content) {
        warnings.push(`Component ${cid} has empty content — may need manual entry.`);
      }
    }

    // Title
    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : "Untitled Strategy";
    if (title === "Untitled Strategy") {
      warnings.push("AI did not return a strategy title — defaulted to 'Untitled Strategy'.");
    }

    // Summary
    const summary =
      typeof parsed.summary === "string"
        ? parsed.summary
        : "No summary extracted.";
    if (summary === "No summary extracted.") {
      warnings.push("AI did not return a summary — defaulted to placeholder.");
    }

    // Selection logic
    const slRaw =
      typeof parsed.selectionLogic === "object" && parsed.selectionLogic !== null
        ? (parsed.selectionLogic as Record<string, unknown>)
        : {};

    if (typeof parsed.selectionLogic !== "object" || parsed.selectionLogic === null) {
      warnings.push("AI response missing 'selectionLogic' — selection logic fields are empty.");
    }

    const result: StrategyExtractionResult = {
      title,
      summary,
      components,
      selectionLogic: {
        adjacentDefinition:
          typeof slRaw.adjacentDefinition === "string"
            ? slRaw.adjacentDefinition
            : null,
        growthDefinition:
          typeof slRaw.growthDefinition === "string"
            ? slRaw.growthDefinition
            : null,
        criteria: asStringArray(slRaw.criteria),
      },
      crossCuttingThemes: asStringArray(parsed.crossCuttingThemes),
      stakeholderCategories: asStringArray(parsed.stakeholderCategories),
      prioritySectorNames: asStringArray(parsed.prioritySectorNames),
      warnings,
    };

    return NextResponse.json(result);
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

    logger.error("Strategy extraction failed", { error: String(error) });
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
