/**
 * POST /api/strategies/extract
 *
 * Accepts extracted strategy document text and returns structured fields
 * via GPT-4o, aligned to the 6-component blueprint.
 * See prompts/sector_strategy_extraction.md for the prompt template.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import {
  buildStrategyExtractSystemPrompt,
  buildStrategyExtractUserPrompt,
  parseStrategyExtractResponse,
  truncateStrategyText,
} from "@/lib/ai/strategy-extract";
import { readJsonWithLimit } from "@/lib/request-utils";
import { requireAuthOrResponse } from "@/lib/api-guards";
import { getOpenAIClient } from "@/lib/ai/openai-client";

// =============================================================================
// Types
// =============================================================================

export interface StrategyExtractionRequest {
  /** Raw extracted text from the strategy document. */
  extractedText: string;
}

export type { StrategyExtractionResult } from "@/lib/ai/types";

// =============================================================================
// Route handler
// =============================================================================

export async function POST(request: Request) {
  const authResponse = await requireAuthOrResponse();
  if (authResponse) return authResponse;

  // Rate limit: 10 requests per minute per IP
  const rlKey = rateLimitKeyFromRequest(request);
  const rl = await checkRateLimit(`strategy-extract:${rlKey}`, 10, 60_000);
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
    const parsedBody = await readJsonWithLimit<StrategyExtractionRequest>(request, 1_000_000);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.error },
        { status: parsedBody.status ?? 400 },
      );
    }
    const body = parsedBody.data!;

    if (!body.extractedText || typeof body.extractedText !== "string") {
      return NextResponse.json(
        { error: "extractedText is required" },
        { status: 400 },
      );
    }

    const text = truncateStrategyText(body.extractedText);

    const systemPrompt = buildStrategyExtractSystemPrompt();
    const userPrompt = buildStrategyExtractUserPrompt(text);

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
    const parsed = parseStrategyExtractResponse(responseText);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 502 },
      );
    }
    return NextResponse.json(parsed.result);
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
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
