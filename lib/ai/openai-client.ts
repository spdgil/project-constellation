/**
 * Shared OpenAI client singleton — lazy initialised.
 * Used by all AI route handlers.
 */
import OpenAI from "openai";
import { env } from "@/lib/env";

let openaiClient: OpenAI | null = null;

/** Get or create the shared OpenAI client. Throws if OPENAI_API_KEY is not set. */
export function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}
