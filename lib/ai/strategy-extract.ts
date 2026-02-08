import { z } from "zod";
import type { StrategyComponentId } from "@/lib/types";
import type { StrategyExtractionResult, ComponentExtraction } from "@/lib/ai/types";

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

export function truncateStrategyText(text: string): string {
  return text.length > 60_000
    ? text.slice(0, 60_000) + "\n\n[Document truncated at 60,000 characters]"
    : text;
}

export function buildStrategyExtractSystemPrompt(): string {
  return `You are an expert economic development analyst specialising in sector development strategies.

Your task is to analyse the full text of a sector development strategy document and extract structured fields aligned to the six-component blueprint for sector development strategies.

## Blueprint Components
1. Sector Diagnostics & Comparative Advantage
2. Economic Geography & Places of Production
3. Regulatory & Enabling Environment
4. Value Chain & Market Integration
5. Workforce & Skills Alignment
6. Sector Culture & Norms

## Output Requirements
Return a single JSON object with the following structure (no markdown, no commentary):

{
  "title": "<strategy title>",
  "summary": "<1-2 paragraph summary>",
  "components": {
    "1": { "content": "<extracted text for component 1>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "2": { "content": "<extracted text for component 2>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "3": { "content": "<extracted text for component 3>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "4": { "content": "<extracted text for component 4>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "5": { "content": "<extracted text for component 5>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" },
    "6": { "content": "<extracted text for component 6>", "confidence": <0.0-1.0>, "sourceExcerpt": "<quote>" }
  },
  "selectionLogic": {
    "adjacentDefinition": "<if specified>",
    "growthDefinition": "<if specified>",
    "criteria": ["<criterion>", "..."]
  },
  "crossCuttingThemes": ["<theme>", "..."],
  "stakeholderCategories": ["<category>", "..."],
  "prioritySectorNames": ["<sector>", "..."]
}

## Guidance
- If a field is missing from the document, return an empty string or empty array, but still include the key.
- Confidence should be 0.0–1.0.
- For components, extract the substance — synthesise relevant content into a coherent paragraph.
`;
}

export function buildStrategyExtractUserPrompt(text: string): string {
  return `Analyse the following sector development strategy document and extract structured fields.

Document text:
"""
${text}
"""
`;
}

export function parseStrategyExtractResponse(
  responseText: string,
): { ok: true; result: StrategyExtractionResult } | { ok: false; error: string } {
  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    return { ok: false, error: "Failed to parse AI response. Please try again." };
  }

  const schema = z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      components: z
        .record(
          z.string(),
          z.object({
            content: z.string().optional(),
            confidence: z.number().optional(),
            sourceExcerpt: z.string().optional(),
          }),
        )
        .optional(),
      selectionLogic: z
        .object({
          adjacentDefinition: z.string().optional().nullable(),
          growthDefinition: z.string().optional().nullable(),
          criteria: z.array(z.string()).optional(),
        })
        .optional(),
      crossCuttingThemes: z.array(z.string()).optional(),
      stakeholderCategories: z.array(z.string()).optional(),
      prioritySectorNames: z.array(z.string()).optional(),
    })
    .passthrough();

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    return { ok: false, error: "Invalid AI response shape. Please try again." };
  }

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

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : "Untitled Strategy";
  if (title === "Untitled Strategy") {
    warnings.push("AI did not return a strategy title — defaulted to 'Untitled Strategy'.");
  }

  const summary =
    typeof parsed.summary === "string"
      ? parsed.summary
      : "No summary extracted.";
  if (summary === "No summary extracted.") {
    warnings.push("AI did not return a summary — defaulted to placeholder.");
  }

  const slRaw =
    typeof parsed.selectionLogic === "object" && parsed.selectionLogic !== null
      ? (parsed.selectionLogic as Record<string, unknown>)
      : {};

  if (typeof parsed.selectionLogic !== "object" || parsed.selectionLogic === null) {
    warnings.push("AI response missing 'selectionLogic' — selection logic fields are empty.");
  }

  return {
    ok: true,
    result: {
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
    },
  };
}
