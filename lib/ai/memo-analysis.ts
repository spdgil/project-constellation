import { z } from "zod";
import type {
  Constraint,
  DealStage,
  GovernmentProgram,
  ReadinessState,
  TimelineMilestone,
} from "@/lib/types";
import type { MemoAnalysisResult } from "@/lib/ai/types";
import { PATHWAY_STAGES } from "@/lib/pathway-data";

const VALID_STAGES: DealStage[] = [
  "definition",
  "pre-feasibility",
  "feasibility",
  "structuring",
  "transaction-close",
];

const VALID_READINESS: ReadinessState[] = [
  "no-viable-projects",
  "conceptual-interest",
  "feasibility-underway",
  "structurable-but-stalled",
  "investable-with-minor-intervention",
  "scaled-and-replicable",
];

const VALID_CONSTRAINTS: Constraint[] = [
  "revenue-certainty",
  "offtake-demand-aggregation",
  "planning-and-approvals",
  "sponsor-capability",
  "early-risk-capital",
  "balance-sheet-constraints",
  "technology-risk",
  "coordination-failure",
  "skills-and-workforce-constraint",
  "common-user-infrastructure-gap",
];

export function truncateMemoText(memoText: string): string {
  return memoText.length > 30_000
    ? memoText.slice(0, 30_000) + "\n\n[Memo truncated at 30,000 characters]"
    : memoText;
}

export function buildMemoAnalysisSystemPrompt(
  opportunityTypes?: { id: string; name: string; definition: string }[],
  lgas?: { id: string; name: string }[],
): string {
  const stageDescriptions = PATHWAY_STAGES.map(
    (s) =>
      `Stage ${s.number} "${s.id}" — ${s.title}: ${s.purpose}\n  Gate items: ${s.gateChecklist.map((g) => g.question).join(", ")}`
  ).join("\n\n");

  const otCatalogue =
    opportunityTypes && opportunityTypes.length > 0
      ? opportunityTypes
          .map((ot) => `- "${ot.id}" — ${ot.name}: ${ot.definition}`)
          .join("\n")
      : "(no existing types)";

  const lgaCatalogue =
    lgas && lgas.length > 0
      ? lgas.map((l) => `- "${l.id}" — ${l.name}`).join("\n")
      : "(no LGAs)";

  return `You are an expert infrastructure investment analyst. Your task is to analyse an investment memo and extract structured deal information.

You must classify the deal into one of these 5 development pathway stages:

${stageDescriptions}

You must assign a readiness state from this ladder:
- "no-viable-projects" — No visible projects
- "conceptual-interest" — Conceptual interest from stakeholders
- "feasibility-underway" — Active feasibility studies
- "structurable-but-stalled" — Could be structured but is blocked
- "investable-with-minor-intervention" — Nearly investable, needs small push
- "scaled-and-replicable" — Proven model, ready for scale

You must identify the dominant binding constraint:
- "revenue-certainty" — Uncertain revenue streams
- "offtake-demand-aggregation" — No committed buyers/demand
- "planning-and-approvals" — Regulatory/planning bottlenecks
- "sponsor-capability" — Sponsor lacks capacity
- "early-risk-capital" — Needs seed/development capital
- "balance-sheet-constraints" — Entity cannot borrow more
- "technology-risk" — Unproven technology
- "coordination-failure" — Multiple parties cannot align
- "skills-and-workforce-constraint" — Workforce gaps
- "common-user-infrastructure-gap" — Shared infrastructure missing

You must suggest an opportunity type. Here are the existing opportunity types:
${otCatalogue}

For the suggestedOpportunityType field:
- STRONGLY PREFER an existing type. Most deals should fit an existing type. Set "existingId" to its ID.
- Only propose a new type if the deal genuinely does not fit ANY existing type.
- If proposing a new type, keep it BROAD and GENERAL — use sector-level categories (e.g. "Agriculture", "Advanced manufacturing", "Defence industry") NOT product-specific labels (e.g. NOT "Wool processing", NOT "Solar panel assembly"). Think of the type as a reusable bucket for many deals, not a label for one deal.
- Set "proposedName" (broad sector label, 1-3 words) and "proposedDefinition" (1-2 sentences describing the sector opportunity). Do NOT set existingId when proposing new.
- When proposing a new type, you MUST also set "closestExistingId" to the ID of the most similar existing type, and "closestExistingReasoning" explaining why that type is the closest but not ideal.
- Set "confidence" to "high", "medium", or "low" based on how well the type matches.
- Always provide "reasoning" explaining your choice.

You must assign at least one LGA (Local Government Area) in Queensland. Here are the available LGAs:
${lgaCatalogue}

For the "suggestedLgaIds" field:
- This is REQUIRED — you must always return at least one LGA ID.
- If the document explicitly mentions a location, use the corresponding LGA.
- If the document does NOT explicitly mention a location, make your BEST EDUCATED GUESS based on the project type, stakeholders, and other contextual clues. Default to "mackay" if truly uncertain.

LOCATION TEXT FOR GEOCODING:
- "suggestedLocationText": Return a specific place name or address suitable for geocoding to a map pin. Examples: "Paget Industrial Estate, Mackay, Queensland", "Eungella Dam, Queensland", "Collinsville, Whitsunday Region, Queensland".
- Be as specific as possible — include suburb/locality, town, and state.
- If the document mentions a specific site, address, or locality, use that.
- If not, make your best guess based on the project context and LGA assignment.
- This field is REQUIRED — always provide a value.

IMPORTANT:
- Use ONLY the exact enum values shown above for stage, readinessState, and dominantConstraint.
- Extract as much structured information as possible from the memo.
- suggestedLgaIds and suggestedLocationText are REQUIRED — always provide them even if you need to estimate.
- For other fields, if information is not available in the memo, omit the field (do not invent data).
- Respond ONLY with a valid JSON object, no markdown fences, no additional text.`;
}

export function buildMemoAnalysisUserPrompt(memoText: string): string {
  return `Analyse the following investment memo and return a JSON object with these fields:

{
  "name": "<short, descriptive deal/project name, 3-8 words>",
  "stage": "<one of: definition, pre-feasibility, feasibility, structuring, transaction-close>",
  "readinessState": "<one of the readiness states listed above>",
  "dominantConstraint": "<one of the constraints listed above>",
  "summary": "<concise 1-2 sentence deal summary>",
  "description": "<rich 2-3 paragraph description>",
  "nextStep": "<recommended next action>",
  "investmentValue": "<estimated investment amount if mentioned>",
  "economicImpact": "<economic impact summary if mentioned>",
  "suggestedLocationText": "<specific place name for geocoding, e.g. 'Paget Industrial Estate, Mackay, Queensland' — REQUIRED>",
  "suggestedLgaIds": ["<at least one LGA id — REQUIRED, guess if not explicitly mentioned>"],
  "keyStakeholders": ["<organisation or person names>"],
  "risks": ["<specific risks and challenges>"],
  "strategicActions": ["<recommended strategic actions>"],
  "infrastructureNeeds": ["<supporting infrastructure requirements>"],
  "skillsImplications": "<workforce and skills implications>",
  "marketDrivers": "<market drivers and demand signals>",
  "governmentPrograms": [{"name": "<program name>", "description": "<brief description>"}],
  "timeline": [{"label": "<milestone>", "date": "<date if known>"}],
  "suggestedOpportunityType": {
    "existingId": "<id of matching existing type, or omit if none fit>",
    "proposedName": "<broad sector label for new type, or omit if existing type matches>",
    "proposedDefinition": "<1-2 sentence definition for new type, or omit>",
    "closestExistingId": "<when proposing new, the id of the closest existing type>",
    "closestExistingReasoning": "<why the closest existing type is similar but not ideal>",
    "confidence": "<high | medium | low>",
    "reasoning": "<1 sentence explaining why this type was chosen>"
  }
}

INVESTMENT MEMO:
${memoText}`;
}

function validateStage(value: unknown): DealStage {
  if (typeof value === "string" && VALID_STAGES.includes(value as DealStage)) {
    return value as DealStage;
  }
  return "definition";
}

function validateReadiness(value: unknown): ReadinessState {
  if (
    typeof value === "string" &&
    VALID_READINESS.includes(value as ReadinessState)
  ) {
    return value as ReadinessState;
  }
  return "conceptual-interest";
}

function validateConstraint(value: unknown): Constraint {
  if (
    typeof value === "string" &&
    VALID_CONSTRAINTS.includes(value as Constraint)
  ) {
    return value as Constraint;
  }
  return "coordination-failure";
}

function asStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return undefined;
}

function asGovPrograms(value: unknown): GovernmentProgram[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter(
      (v): v is { name: string; description?: string } =>
        typeof v === "object" && v !== null && typeof (v as Record<string, unknown>).name === "string"
    )
    .map((v) => ({
      name: v.name,
      description: typeof v.description === "string" ? v.description : undefined,
    }));
}

function asTimeline(value: unknown): TimelineMilestone[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter(
      (v): v is { label: string; date?: string } =>
        typeof v === "object" && v !== null && typeof (v as Record<string, unknown>).label === "string"
    )
    .map((v) => ({
      label: v.label,
      date: typeof v.date === "string" ? v.date : undefined,
    }));
}

function validateSuggestedOT(
  value: unknown,
  knownTypes?: { id: string }[]
): MemoAnalysisResult["suggestedOpportunityType"] {
  const fallback: MemoAnalysisResult["suggestedOpportunityType"] = {
    confidence: "low",
    reasoning: "Could not determine opportunity type from the document.",
  };

  if (typeof value !== "object" || value === null) return fallback;
  const obj = value as Record<string, unknown>;

  const confidence =
    typeof obj.confidence === "string" &&
    ["high", "medium", "low"].includes(obj.confidence)
      ? (obj.confidence as "high" | "medium" | "low")
      : "low";

  const reasoning =
    typeof obj.reasoning === "string" && obj.reasoning.trim()
      ? obj.reasoning.trim()
      : "No reasoning provided.";

  if (typeof obj.existingId === "string" && obj.existingId.trim()) {
    const knownIds = (knownTypes ?? []).map((t) => t.id);
    if (knownIds.includes(obj.existingId.trim())) {
      return { existingId: obj.existingId.trim(), confidence, reasoning };
    }
  }

  if (typeof obj.proposedName === "string" && obj.proposedName.trim()) {
    const knownIds = (knownTypes ?? []).map((t) => t.id);
    const closestExistingId =
      typeof obj.closestExistingId === "string" &&
      obj.closestExistingId.trim() &&
      knownIds.includes(obj.closestExistingId.trim())
        ? obj.closestExistingId.trim()
        : undefined;
    const closestExistingReasoning =
      typeof obj.closestExistingReasoning === "string" &&
      obj.closestExistingReasoning.trim()
        ? obj.closestExistingReasoning.trim()
        : undefined;

    return {
      proposedName: obj.proposedName.trim(),
      proposedDefinition:
        typeof obj.proposedDefinition === "string"
          ? obj.proposedDefinition.trim()
          : undefined,
      closestExistingId,
      closestExistingReasoning,
      confidence,
      reasoning,
    };
  }

  return fallback;
}

export function parseMemoAnalysisResponse(
  responseText: string,
  options: {
    memoLabel?: string;
    opportunityTypes?: { id: string }[];
    lgas?: { id: string }[];
  }
): { ok: true; result: MemoAnalysisResult } | { ok: false; error: string } {
  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    return { ok: false, error: "Failed to parse AI response. Please try again." };
  }

  const schema = z
    .object({
      name: z.string().optional(),
      stage: z.string().optional(),
      readinessState: z.string().optional(),
      dominantConstraint: z.string().optional(),
      summary: z.string().optional(),
      description: z.string().optional(),
      nextStep: z.string().optional(),
      investmentValue: z.string().optional(),
      economicImpact: z.string().optional(),
      suggestedLocationText: z.string().optional(),
      suggestedLgaIds: z.array(z.string()).optional(),
      keyStakeholders: z.array(z.string()).optional(),
      risks: z.array(z.string()).optional(),
      strategicActions: z.array(z.string()).optional(),
      infrastructureNeeds: z.array(z.string()).optional(),
      skillsImplications: z.string().optional(),
      marketDrivers: z.string().optional(),
      governmentPrograms: z
        .array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
          })
        )
        .optional(),
      timeline: z
        .array(
          z.object({
            label: z.string(),
            date: z.string().optional(),
          })
        )
        .optional(),
      suggestedOpportunityType: z
        .object({
          existingId: z.string().optional(),
          proposedName: z.string().optional(),
          proposedDefinition: z.string().optional(),
          closestExistingId: z.string().optional(),
          closestExistingReasoning: z.string().optional(),
          confidence: z.string().optional(),
          reasoning: z.string().optional(),
        })
        .optional(),
    })
    .passthrough();

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    return { ok: false, error: "Invalid AI response shape. Please try again." };
  }

  const memoLabel = options.memoLabel || "Investment Memo";

  const knownLgaIds = (options.lgas ?? []).map((l) => l.id);
  let suggestedLgaIds: string[] = [];
  if (Array.isArray(parsed.suggestedLgaIds)) {
    suggestedLgaIds = (parsed.suggestedLgaIds as unknown[])
      .filter((v): v is string => typeof v === "string" && knownLgaIds.includes(v));
  }
  if (suggestedLgaIds.length === 0) {
    suggestedLgaIds = knownLgaIds.includes("mackay") ? ["mackay"] : knownLgaIds.slice(0, 1);
  }

  const suggestedLocationText =
    typeof parsed.suggestedLocationText === "string" && parsed.suggestedLocationText.trim()
      ? parsed.suggestedLocationText.trim()
      : null;

  return {
    ok: true,
    result: {
      name:
        typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name.trim()
          : "Untitled Deal",
      stage: validateStage(parsed.stage),
      readinessState: validateReadiness(parsed.readinessState),
      dominantConstraint: validateConstraint(parsed.dominantConstraint),
      summary:
        typeof parsed.summary === "string" ? parsed.summary : "No summary extracted.",
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      nextStep:
        typeof parsed.nextStep === "string" ? parsed.nextStep : "",
      investmentValue:
        typeof parsed.investmentValue === "string"
          ? parsed.investmentValue
          : undefined,
      economicImpact:
        typeof parsed.economicImpact === "string"
          ? parsed.economicImpact
          : undefined,
      suggestedLocationText,
      suggestedLgaIds,
      keyStakeholders: asStringArray(parsed.keyStakeholders),
      risks: asStringArray(parsed.risks),
      strategicActions: asStringArray(parsed.strategicActions),
      infrastructureNeeds: asStringArray(parsed.infrastructureNeeds),
      skillsImplications:
        typeof parsed.skillsImplications === "string"
          ? parsed.skillsImplications
          : undefined,
      marketDrivers:
        typeof parsed.marketDrivers === "string"
          ? parsed.marketDrivers
          : undefined,
      governmentPrograms: asGovPrograms(parsed.governmentPrograms),
      timeline: asTimeline(parsed.timeline),
      memoReference: {
        label: `Investment Memo: ${memoLabel}`,
        pageRef: undefined,
      },
      suggestedOpportunityType: validateSuggestedOT(
        parsed.suggestedOpportunityType,
        options.opportunityTypes,
      ),
    },
  };
}
