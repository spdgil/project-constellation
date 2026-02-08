/**
 * POST /api/deals/analyse-memo
 *
 * Accepts investment memo text and returns structured deal fields
 * extracted via GPT-4o. Server-side only — API key never exposed to client.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";

import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import {
  buildMemoAnalysisSystemPrompt,
  buildMemoAnalysisUserPrompt,
  parseMemoAnalysisResponse,
  truncateMemoText,
} from "@/lib/ai/memo-analysis";
import { readJsonWithLimit } from "@/lib/request-utils";
import { requireAuthOrResponse } from "@/lib/api-guards";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import {
  RATE_LIMITS,
  RATE_LIMIT_WINDOW_MS,
  MAX_BODY_BYTES,
} from "@/lib/api-constants";

// =============================================================================
// Types
// =============================================================================

export interface MemoAnalysisRequest {
  memoText: string;
  memoLabel?: string;
  /** Known opportunity type catalogue — passed so AI can match or propose new. */
  opportunityTypes?: { id: string; name: string; definition: string }[];
  /** Known LGAs — passed so AI can assign at least one. */
  lgas?: { id: string; name: string }[];
}

export type { MemoAnalysisResult } from "@/lib/ai/types";

// =============================================================================
// Route handler
// =============================================================================

export async function POST(request: Request) {
  const authResponse = await requireAuthOrResponse();
  if (authResponse) return authResponse;

  // Rate limit: 10 requests per minute per IP
  const rlKey = rateLimitKeyFromRequest(request);
  const rl = await checkRateLimit(`analyse-memo:${rlKey}`, RATE_LIMITS.ai, RATE_LIMIT_WINDOW_MS);
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
    const parsedBody = await readJsonWithLimit<MemoAnalysisRequest>(request, MAX_BODY_BYTES.ai);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.error },
        { status: parsedBody.status ?? 400 },
      );
    }
    const body = parsedBody.data!;

    if (!body.memoText || typeof body.memoText !== "string") {
      return NextResponse.json(
        { error: "memoText is required" },
        { status: 400 }
      );
    }

    const memoText = truncateMemoText(body.memoText);

    const systemPrompt = buildMemoAnalysisSystemPrompt(
      body.opportunityTypes,
      body.lgas,
    );
    const userPrompt = buildMemoAnalysisUserPrompt(memoText);

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
    const parsed = parseMemoAnalysisResponse(responseText, {
      memoLabel: body.memoLabel,
      opportunityTypes: body.opportunityTypes,
      lgas: body.lgas,
    });
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.result);
  } catch (error) {
    // Handle OpenAI-specific errors (matching Relational Imperative pattern)
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: "API configuration error. Check your OPENAI_API_KEY." },
          { status: 500 }
        );
      }
    }

    logger.error("Analyse memo failed", { error: String(error) });
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
