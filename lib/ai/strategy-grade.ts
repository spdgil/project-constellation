import { z } from "zod";
import type {
  GradeLetter,
  StrategyComponentId,
  StrategyGradeMissingElement,
} from "@/lib/types";

interface GradingLLMResponse {
  grade_letter: string;
  grade_rationale_short: string;
  evidence_notes_by_component: Record<string, string>;
  missing_elements: Array<{ component_id: string; reason: string }>;
  scope_discipline_notes: string;
}

export function buildStrategyGradeSystemPrompt(): string {
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
  "scope_discipline_notes": "<1–2 sentence scope discipline check>"
}`;
}

export function buildStrategyGradeUserPrompt(strategy: {
  title: string;
  components: Record<string, string>;
  selectionLogic?: {
    adjacentDefinition?: string;
    growthDefinition?: string;
    criteria?: string[];
  };
  crossCuttingThemes: string[];
  stakeholderCategories: string[];
}): string {
  return `Grade the following sector development strategy based on the six-component blueprint.

Strategy title: ${strategy.title}

Component 1 (Diagnostics & Comparative Advantage):
${strategy.components["1"] || "(empty)"}

Component 2 (Economic Geography & Places of Production):
${strategy.components["2"] || "(empty)"}

Component 3 (Regulatory & Enabling Environment):
${strategy.components["3"] || "(empty)"}

Component 4 (Value Chain & Market Integration):
${strategy.components["4"] || "(empty)"}

Component 5 (Workforce & Skills Alignment):
${strategy.components["5"] || "(empty)"}

Component 6 (Sector Culture & Norms):
${strategy.components["6"] || "(empty)"}

Selection Logic (if provided):
- Adjacent definition: ${strategy.selectionLogic?.adjacentDefinition || "(none)"}
- Growth definition: ${strategy.selectionLogic?.growthDefinition || "(none)"}
- Criteria: ${strategy.selectionLogic?.criteria?.join(", ") || "(none)"}

Cross-cutting themes: ${strategy.crossCuttingThemes.join(", ") || "(none)"}
Stakeholder categories: ${strategy.stakeholderCategories.join(", ") || "(none)"}`;
}

export function parseStrategyGradeResponse(
  parsed: Record<string, unknown>
): {
  grade_letter: GradeLetter;
  grade_rationale_short: string;
  evidence_notes_by_component: Record<StrategyComponentId, string>;
  missing_elements: StrategyGradeMissingElement[];
  scope_discipline_notes: string;
  warnings: string[];
} {
  const schema = z
    .object({
      grade_letter: z.string().optional(),
      grade_rationale_short: z.string().optional(),
      evidence_notes_by_component: z.record(z.string(), z.string()).optional(),
      missing_elements: z
        .array(
          z.object({
            component_id: z.string(),
            reason: z.string(),
          })
        )
        .optional(),
      scope_discipline_notes: z.string().optional(),
    })
    .passthrough();

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    return {
      grade_letter: "C",
      grade_rationale_short: "Invalid AI response format.",
      evidence_notes_by_component: {
        "1": "",
        "2": "",
        "3": "",
        "4": "",
        "5": "",
        "6": "",
      },
      missing_elements: [],
      scope_discipline_notes: "No scope discipline notes provided.",
      warnings: ["Invalid AI response shape — defaulted to safe values."],
    };
  }

  const warnings: string[] = [];

  const gradeLetter =
    typeof parsed.grade_letter === "string" ? parsed.grade_letter.trim() : "";

  const grade_rationale_short =
    typeof parsed.grade_rationale_short === "string"
      ? parsed.grade_rationale_short
      : "No rationale provided.";
  if (typeof parsed.grade_rationale_short !== "string") {
    warnings.push("AI response missing grade_rationale_short — defaulted to placeholder.");
  }

  const evidenceRaw =
    typeof parsed.evidence_notes_by_component === "object" &&
    parsed.evidence_notes_by_component !== null
      ? (parsed.evidence_notes_by_component as Record<string, unknown>)
      : {};
  if (typeof parsed.evidence_notes_by_component !== "object" || parsed.evidence_notes_by_component === null) {
    warnings.push("AI response missing evidence_notes_by_component — all evidence notes defaulted.");
  }

  const evidence_notes_by_component: Record<StrategyComponentId, string> = {
    "1": "",
    "2": "",
    "3": "",
    "4": "",
    "5": "",
    "6": "",
  };
  (["1", "2", "3", "4", "5", "6"] as StrategyComponentId[]).forEach((cid) => {
    const note = evidenceRaw[cid];
    evidence_notes_by_component[cid] = typeof note === "string" ? note : "";
    if (typeof note !== "string") {
      warnings.push(`Evidence note for component ${cid} missing — defaulted to empty.`);
    }
  });

  let missingElements: StrategyGradeMissingElement[] = [];
  if (Array.isArray(parsed.missing_elements)) {
    missingElements = parsed.missing_elements
      .filter(
        (m): m is { component_id: string; reason: string } =>
          typeof m === "object" &&
          m !== null &&
          typeof (m as Record<string, unknown>).component_id === "string" &&
          typeof (m as Record<string, unknown>).reason === "string"
      )
      .map((m) => ({
        componentId: m.component_id as StrategyComponentId,
        reason: m.reason,
      }));
  }

  const scope_discipline_notes =
    typeof parsed.scope_discipline_notes === "string"
      ? parsed.scope_discipline_notes
      : "No scope discipline notes provided.";
  if (typeof parsed.scope_discipline_notes !== "string") {
    warnings.push("AI response missing scope_discipline_notes — defaulted to placeholder.");
  }

  const normalizedGrade = ([
    "A",
    "A-",
    "B",
    "B-",
    "C",
    "D",
    "F",
  ] as const).includes(gradeLetter as GradeLetter)
    ? (gradeLetter as GradeLetter)
    : "C";
  if (normalizedGrade === "C" && gradeLetter !== "C") {
    warnings.push("Invalid grade_letter from AI — defaulted to C.");
  }

  return {
    grade_letter: normalizedGrade,
    grade_rationale_short,
    evidence_notes_by_component,
    missing_elements: missingElements,
    scope_discipline_notes,
    warnings,
  };
}
