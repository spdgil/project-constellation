"use client";

import { useState, useCallback, useMemo, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  SectorDevelopmentStrategy,
  SectorOpportunity,
  StrategyComponentId,
  GradeLetter,
} from "@/lib/types";
import {
  STRATEGY_COMPONENT_NAMES,
  STRATEGY_COMPONENT_EDDT_DOMAINS,
} from "@/lib/types";
import type {
  StrategyExtractionResult,
  ComponentExtraction,
} from "@/app/api/strategies/extract/route";
import type { StrategyGradeResult } from "@/app/api/strategies/[id]/grade/route";

// =============================================================================
// Props
// =============================================================================

export interface StrategyDraftProps {
  strategy: SectorDevelopmentStrategy;
}

// =============================================================================
// Constants
// =============================================================================

const COMPONENT_IDS: StrategyComponentId[] = ["1", "2", "3", "4", "5", "6"];

const labelClass =
  "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

const inputClass =
  "w-full px-3 py-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm leading-relaxed placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out resize-y";

/** Humanise snake_case strings. */
function humanise(s: string): string {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Grade colour class by grade letter. */
const GRADE_COLOUR_CLASSES: Record<GradeLetter, string> = {
  A: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "A-": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  B: "bg-blue-50 text-blue-700 border border-blue-200",
  "B-": "bg-blue-50 text-blue-700 border border-blue-200",
  C: "bg-amber-50 text-amber-700 border border-amber-200",
  D: "bg-orange-50 text-orange-700 border border-orange-200",
  F: "bg-red-50 text-red-700 border border-red-200",
};

function gradeColourClass(g: GradeLetter): string {
  return GRADE_COLOUR_CLASSES[g] ?? "bg-gray-50 text-gray-700 border border-gray-200";
}

/** Confidence bar colour based on value. */
function confidenceColour(c: number): string {
  if (c >= 0.7) return "bg-emerald-500";
  if (c >= 0.4) return "bg-amber-500";
  return "bg-red-400";
}

function confidenceLabel(c: number): string {
  if (c >= 0.7) return "High";
  if (c >= 0.4) return "Medium";
  return "Low";
}

// =============================================================================
// Component
// =============================================================================

export function StrategyDraft({ strategy: initial }: StrategyDraftProps) {
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Core editable state
  // ---------------------------------------------------------------------------
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [components, setComponents] = useState<Record<StrategyComponentId, string>>(
    () => ({ ...initial.components }),
  );
  const [adjacentDef, setAdjacentDef] = useState(
    initial.selectionLogic?.adjacentDefinition ?? "",
  );
  const [growthDef, setGrowthDef] = useState(
    initial.selectionLogic?.growthDefinition ?? "",
  );
  const [criteria, setCriteria] = useState(
    (initial.selectionLogic?.criteria ?? []).join("\n"),
  );
  const [crossCutting, setCrossCutting] = useState(
    initial.crossCuttingThemes.join("\n"),
  );
  const [stakeholders, setStakeholders] = useState(
    initial.stakeholderCategories.join("\n"),
  );

  // ---------------------------------------------------------------------------
  // Linked sector opportunities
  // ---------------------------------------------------------------------------
  const [linkedSectorIds, setLinkedSectorIds] = useState<string[]>(
    () => [...initial.prioritySectorIds],
  );
  const [availableSectors, setAvailableSectors] = useState<
    Pick<SectorOpportunity, "id" | "name">[]
  >([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const sectorPickerId = useId();

  useEffect(() => {
    let cancelled = false;
    async function fetchSectors() {
      try {
        const res = await fetch("/api/sectors");
        if (res.ok) {
          const data = (await res.json()) as SectorOpportunity[];
          if (!cancelled) {
            setAvailableSectors(
              data.map((s) => ({ id: s.id, name: s.name })),
            );
          }
        }
      } catch {
        /* silent — picker will be empty */
      } finally {
        if (!cancelled) setSectorsLoading(false);
      }
    }
    fetchSectors();
    return () => { cancelled = true; };
  }, []);

  /** Sectors not yet linked (for the "add" dropdown). */
  const unlinkedSectors = useMemo(() => {
    const linked = new Set(linkedSectorIds);
    return availableSectors.filter((s) => !linked.has(s.id));
  }, [availableSectors, linkedSectorIds]);

  /** Sector lookup for display names. */
  const sectorNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of availableSectors) m.set(s.id, s.name);
    return m;
  }, [availableSectors]);

  const addSectorLink = useCallback((sectorId: string) => {
    setLinkedSectorIds((prev) =>
      prev.includes(sectorId) ? prev : [...prev, sectorId],
    );
  }, []);

  const removeSectorLink = useCallback((sectorId: string) => {
    setLinkedSectorIds((prev) => prev.filter((id) => id !== sectorId));
  }, []);

  const moveSectorLink = useCallback(
    (sectorId: string, direction: "up" | "down") => {
      setLinkedSectorIds((prev) => {
        const idx = prev.indexOf(sectorId);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // AI extraction state
  // ---------------------------------------------------------------------------
  const [extraction, setExtraction] = useState<StrategyExtractionResult | null>(
    null,
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // Confidence per component (from AI)
  // ---------------------------------------------------------------------------
  const [confidences, setConfidences] = useState<
    Record<StrategyComponentId, { confidence: number; sourceExcerpt: string }>
  >({
    "1": { confidence: 0, sourceExcerpt: "" },
    "2": { confidence: 0, sourceExcerpt: "" },
    "3": { confidence: 0, sourceExcerpt: "" },
    "4": { confidence: 0, sourceExcerpt: "" },
    "5": { confidence: 0, sourceExcerpt: "" },
    "6": { confidence: 0, sourceExcerpt: "" },
  });

  // ---------------------------------------------------------------------------
  // Save / publish state
  // ---------------------------------------------------------------------------
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // ---------------------------------------------------------------------------
  // Grading state
  // ---------------------------------------------------------------------------
  const [gradeResult, setGradeResult] = useState<StrategyGradeResult | null>(
    null,
  );
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Extracted text stats
  // ---------------------------------------------------------------------------
  const textStats = useMemo(() => {
    if (!initial.extractedText) return null;
    const words = initial.extractedText.split(/\s+/).filter(Boolean).length;
    return { words, chars: initial.extractedText.length };
  }, [initial.extractedText]);

  // ---------------------------------------------------------------------------
  // Workflow step indicator state
  // ---------------------------------------------------------------------------
  const workflowSteps = useMemo(() => {
    const hasExtractedText = !!initial.extractedText;
    const extractionDone = !!extraction || COMPONENT_IDS.some((cid) => initial.components[cid]?.trim());
    const hasEdits = COMPONENT_IDS.some((cid) => components[cid]?.trim());
    const graded = !!gradeResult;

    return [
      { label: "Upload", done: true },
      {
        label: "Extract",
        done: extractionDone,
        active: hasExtractedText && !extractionDone,
        skippable: !hasExtractedText,
      },
      { label: "Edit", done: hasEdits, active: extractionDone && !graded },
      { label: "Grade", done: graded, active: hasEdits && !graded },
      { label: "Publish", done: initial.status === "published", active: hasEdits },
    ];
  }, [initial.extractedText, initial.components, initial.status, extraction, components, gradeResult]);

  // ---------------------------------------------------------------------------
  // Run AI extraction
  // ---------------------------------------------------------------------------
  const handleExtract = useCallback(async () => {
    if (!initial.extractedText) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/strategies/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedText: initial.extractedText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            `Extraction failed (${res.status})`,
        );
      }

      const result = (await res.json()) as StrategyExtractionResult;
      setExtraction(result);
      setExtractionWarnings(result.warnings ?? []);

      // Populate editable fields from AI result
      setTitle(result.title);
      setSummary(result.summary);

      const newComponents = { ...components };
      const newConfidences = { ...confidences };
      for (const cid of COMPONENT_IDS) {
        const c = result.components[cid];
        newComponents[cid] = c.content;
        newConfidences[cid] = {
          confidence: c.confidence,
          sourceExcerpt: c.sourceExcerpt,
        };
      }
      setComponents(newComponents);
      setConfidences(newConfidences);

      if (result.selectionLogic.adjacentDefinition) {
        setAdjacentDef(result.selectionLogic.adjacentDefinition);
      }
      if (result.selectionLogic.growthDefinition) {
        setGrowthDef(result.selectionLogic.growthDefinition);
      }
      if (result.selectionLogic.criteria.length > 0) {
        setCriteria(result.selectionLogic.criteria.join("\n"));
      }
      if (result.crossCuttingThemes.length > 0) {
        setCrossCutting(result.crossCuttingThemes.join("\n"));
      }
      if (result.stakeholderCategories.length > 0) {
        setStakeholders(result.stakeholderCategories.join("\n"));
      }

      // Auto-save extracted fields so they persist even if the user navigates away
      try {
        await fetch(`/api/strategies/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: result.title,
            summary: result.summary,
            components: Object.fromEntries(
              COMPONENT_IDS.map((cid) => [cid, result.components[cid].content]),
            ),
            selectionLogic: {
              adjacentDefinition: result.selectionLogic.adjacentDefinition,
              growthDefinition: result.selectionLogic.growthDefinition,
              criteria: result.selectionLogic.criteria,
            },
            crossCuttingThemes: result.crossCuttingThemes,
            stakeholderCategories: result.stakeholderCategories,
            prioritySectorIds: linkedSectorIds,
          }),
        });
        setSavedAt(new Date().toLocaleTimeString());
      } catch {
        // Auto-save failed — not fatal; user can manually save
      }
    } catch (err) {
      setExtractError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsExtracting(false);
    }
  }, [initial.id, initial.extractedText, components, confidences, linkedSectorIds]);

  // ---------------------------------------------------------------------------
  // Save draft
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const parseLines = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    try {
      const res = await fetch(`/api/strategies/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          components,
          selectionLogic: {
            adjacentDefinition: adjacentDef.trim() || null,
            growthDefinition: growthDef.trim() || null,
            criteria: parseLines(criteria),
          },
          crossCuttingThemes: parseLines(crossCutting),
          stakeholderCategories: parseLines(stakeholders),
          prioritySectorIds: linkedSectorIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `Save failed (${res.status})`,
        );
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    initial.id,
    title,
    summary,
    components,
    adjacentDef,
    growthDef,
    criteria,
    crossCutting,
    stakeholders,
    linkedSectorIds,
  ]);

  // ---------------------------------------------------------------------------
  // Finalise (publish)
  // ---------------------------------------------------------------------------
  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    setSaveError(null);

    const parseLines = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    try {
      const res = await fetch(`/api/strategies/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          components,
          selectionLogic: {
            adjacentDefinition: adjacentDef.trim() || null,
            growthDefinition: growthDef.trim() || null,
            criteria: parseLines(criteria),
          },
          crossCuttingThemes: parseLines(crossCutting),
          stakeholderCategories: parseLines(stakeholders),
          prioritySectorIds: linkedSectorIds,
          status: "published",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            `Publish failed (${res.status})`,
        );
      }
      router.push(`/strategies/${initial.id}`);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to publish.",
      );
      setIsPublishing(false);
    }
  }, [
    initial.id,
    title,
    summary,
    components,
    adjacentDef,
    growthDef,
    criteria,
    crossCutting,
    stakeholders,
    linkedSectorIds,
    router,
  ]);

  // ---------------------------------------------------------------------------
  // Run AI grading
  // ---------------------------------------------------------------------------
  const handleGrade = useCallback(async () => {
    // Save draft first so the API reads current content
    setIsGrading(true);
    setGradeError(null);

    const parseLines = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    try {
      // Save current state first
      const saveRes = await fetch(`/api/strategies/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          components,
          selectionLogic: {
            adjacentDefinition: adjacentDef.trim() || null,
            growthDefinition: growthDef.trim() || null,
            criteria: parseLines(criteria),
          },
          crossCuttingThemes: parseLines(crossCutting),
          stakeholderCategories: parseLines(stakeholders),
          prioritySectorIds: linkedSectorIds,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save draft before grading.");
      }

      setSavedAt(new Date().toLocaleTimeString());

      // Now grade
      const res = await fetch(`/api/strategies/${initial.id}/grade`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            `Grading failed (${res.status})`,
        );
      }

      const result = (await res.json()) as StrategyGradeResult;
      setGradeResult(result);
    } catch (err) {
      setGradeError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsGrading(false);
    }
  }, [
    initial.id,
    title,
    summary,
    components,
    adjacentDef,
    growthDef,
    criteria,
    crossCutting,
    stakeholders,
  ]);

  // ---------------------------------------------------------------------------
  // Component field updater
  // ---------------------------------------------------------------------------
  const updateComponent = useCallback(
    (cid: StrategyComponentId, value: string) => {
      setComponents((prev) => ({ ...prev, [cid]: value }));
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6" data-testid="strategy-draft">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/strategies"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          ← All strategies
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
            Draft
          </span>
          {savedAt && (
            <span className="text-xs text-[#6B6B6B]">Saved {savedAt}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm border border-[#E8E6E3] bg-white text-[#2C2C2C] hover:bg-[#F5F3F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] transition duration-300 ease-out disabled:opacity-50"
            data-testid="save-draft-btn"
          >
            {isSaving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
            className="px-3 py-1.5 text-sm bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out disabled:opacity-50"
            data-testid="publish-btn"
          >
            {isPublishing ? "Publishing…" : "Accept and publish"}
          </button>
        </div>
      </div>

      {/* Workflow step indicator */}
      <nav
        aria-label="Strategy import workflow"
        className="bg-white border border-[#E8E6E3] px-5 py-3"
        data-testid="workflow-steps"
      >
        <ol className="flex items-center gap-0 list-none p-0 m-0">
          {workflowSteps.map((step, i) => {
            const isLast = i === workflowSteps.length - 1;
            return (
              <li key={step.label} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  {/* Step circle */}
                  <span
                    className={[
                      "flex items-center justify-center w-5 h-5 text-[9px] font-medium border transition-colors",
                      step.done
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : step.active
                          ? "bg-[#FAF9F7] text-[#2C2C2C] border-[#7A6B5A]"
                          : "bg-[#FAF9F7] text-[#9A9A9A] border-[#E8E6E3]",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {step.done ? "✓" : i + 1}
                  </span>
                  {/* Step label */}
                  <span
                    className={[
                      "text-[10px] uppercase tracking-wider font-medium",
                      step.done
                        ? "text-emerald-700"
                        : step.active
                          ? "text-[#2C2C2C]"
                          : "text-[#9A9A9A]",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={[
                      "w-6 h-px mx-1.5",
                      step.done ? "bg-emerald-300" : "bg-[#E8E6E3]",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {saveError && (
        <div className="bg-red-50 border border-red-200 px-4 py-3" role="alert">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {/* Title and summary */}
      <section className="bg-white border border-[#E8E6E3] p-6 space-y-4">
        <div>
          <label htmlFor="draft-title" className={labelClass}>
            Strategy title
          </label>
          <input
            id="draft-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full h-10 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] font-heading text-lg focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
            data-testid="draft-title-input"
          />
        </div>
        <div>
          <label htmlFor="draft-summary" className={labelClass}>
            Summary
          </label>
          <textarea
            id="draft-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="2–3 sentence summary…"
            className={`mt-1 ${inputClass}`}
            data-testid="draft-summary-input"
          />
        </div>
      </section>

      {/* AI extraction trigger */}
      {initial.extractedText && !extraction && (
        <div className="bg-[#F5F3F0] border border-[#E8E6E3] px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className={labelClass}>AI-assisted extraction</p>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mt-1">
              {textStats
                ? `${textStats.words.toLocaleString()} words extracted from source document.`
                : "Source text available."}{" "}
              Run AI extraction to populate blueprint components.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting}
            className="shrink-0 px-4 py-2 text-sm bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out disabled:opacity-50"
            data-testid="run-extraction-btn"
          >
            {isExtracting ? "Extracting…" : "Run AI extraction"}
          </button>
        </div>
      )}

      {isExtracting && (
        <div
          className="flex items-center gap-3 bg-[#F5F3F0] border border-[#E8E6E3] px-4 py-3"
          role="status"
        >
          <svg
            className="h-5 w-5 animate-spin text-[#7A6B5A]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              className="opacity-75"
            />
          </svg>
          <p className="text-sm text-[#2C2C2C]">
            Analysing document and extracting blueprint components…
          </p>
        </div>
      )}

      {extractError && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 space-y-2" role="alert">
          <p className="text-sm text-red-800">{extractError}</p>
          <button
            type="button"
            onClick={handleExtract}
            className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900"
          >
            Retry extraction
          </button>
        </div>
      )}

      {/* Extraction warnings */}
      {extractionWarnings.length > 0 && (
        <div
          className="bg-amber-50 border border-amber-200 px-4 py-3 space-y-1"
          role="status"
          data-testid="extraction-warnings"
        >
          <p className="text-xs font-medium text-amber-800">
            AI extraction completed with {extractionWarnings.length}{" "}
            {extractionWarnings.length === 1 ? "warning" : "warnings"}:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {extractionWarnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Side-by-side: Source excerpts (left) + Extracted fields (right) */}
      <div className="space-y-4" data-testid="components-editor">
        <h2 className="font-heading text-lg font-normal text-[#2C2C2C]">
          Blueprint Components
        </h2>

        {COMPONENT_IDS.map((cid) => {
          const conf = confidences[cid];
          const domains = STRATEGY_COMPONENT_EDDT_DOMAINS[cid];

          return (
            <div
              key={cid}
              className="bg-white border border-[#E8E6E3]"
              data-testid={`component-${cid}`}
            >
              {/* Component header */}
              <div className="px-5 py-3 border-b border-[#E8E6E3] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={labelClass}>
                    {cid}. {STRATEGY_COMPONENT_NAMES[cid]}
                  </span>
                  {domains.map((d) => (
                    <span
                      key={d}
                      className="text-[9px] uppercase tracking-wider px-1 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                {/* Confidence indicator */}
                {(extraction || conf.confidence > 0) && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-[#E8E6E3] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-out ${confidenceColour(conf.confidence)}`}
                        style={{ width: `${Math.round(conf.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] whitespace-nowrap">
                      {confidenceLabel(conf.confidence)}{" "}
                      ({Math.round(conf.confidence * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Side-by-side panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E6E3]">
                {/* Left: source excerpt */}
                <div className="p-4 bg-[#FAF9F7] min-h-[120px]">
                  <p className={`${labelClass} mb-2`}>Source excerpt</p>
                  {conf.sourceExcerpt ? (
                    <blockquote className="text-xs text-[#2C2C2C] leading-relaxed italic border-l-2 border-[#C8C4BF] pl-3">
                      {conf.sourceExcerpt}
                    </blockquote>
                  ) : (
                    <p className="text-xs text-[#9A9A9A] italic">
                      {extraction
                        ? "No source excerpt available for this component."
                        : "Run AI extraction to see source excerpts."}
                    </p>
                  )}
                </div>

                {/* Right: editable extracted content */}
                <div className="p-4">
                  <p className={`${labelClass} mb-2`}>Extracted content</p>
                  <textarea
                    value={components[cid]}
                    onChange={(e) => updateComponent(cid, e.target.value)}
                    rows={4}
                    placeholder={`Content for ${STRATEGY_COMPONENT_NAMES[cid]}…`}
                    className={inputClass}
                    data-testid={`component-${cid}-input`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection logic */}
      <section className="bg-white border border-[#E8E6E3] p-5 space-y-4">
        <h2 className="font-heading text-lg font-normal text-[#2C2C2C]">
          Selection Logic
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="adjacent-def" className={labelClass}>
              Adjacent sector definition
            </label>
            <textarea
              id="adjacent-def"
              value={adjacentDef}
              onChange={(e) => setAdjacentDef(e.target.value)}
              rows={3}
              placeholder="What makes a sector 'adjacent'…"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="growth-def" className={labelClass}>
              Growth sector definition
            </label>
            <textarea
              id="growth-def"
              value={growthDef}
              onChange={(e) => setGrowthDef(e.target.value)}
              rows={3}
              placeholder="What makes a sector a 'growth' opportunity…"
              className={`mt-1 ${inputClass}`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="criteria" className={labelClass}>
            Selection criteria (one per line)
          </label>
          <textarea
            id="criteria"
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={3}
            placeholder="government_priority&#10;size_scale_of_opportunity&#10;…"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </section>

      {/* Cross-cutting themes and stakeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-[#E8E6E3] p-5 space-y-3">
          <label htmlFor="cross-cutting" className={labelClass}>
            Cross-cutting action themes (one per line)
          </label>
          <textarea
            id="cross-cutting"
            value={crossCutting}
            onChange={(e) => setCrossCutting(e.target.value)}
            rows={4}
            placeholder="supporting_skills_development_and_transferability&#10;…"
            className={inputClass}
          />
        </section>

        <section className="bg-white border border-[#E8E6E3] p-5 space-y-3">
          <label htmlFor="stakeholders" className={labelClass}>
            Stakeholder categories (one per line)
          </label>
          <textarea
            id="stakeholders"
            value={stakeholders}
            onChange={(e) => setStakeholders(e.target.value)}
            rows={4}
            placeholder="state_and_local_government&#10;sector_businesses&#10;…"
            className={inputClass}
          />
        </section>
      </div>

      {/* Priority sector names (read-only from extraction) */}
      {extraction && extraction.prioritySectorNames.length > 0 && (
        <section className="bg-white border border-[#E8E6E3] p-5 space-y-3">
          <p className={labelClass}>Priority sectors identified by AI</p>
          <div className="flex flex-wrap gap-1.5">
            {extraction.prioritySectorNames.map((name) => (
              <span
                key={name}
                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
              >
                {name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Linked sector opportunities editor */}
      <section
        className="bg-white border border-[#E8E6E3] p-5 space-y-4"
        data-testid="sector-links-editor"
      >
        <h2 className="font-heading text-lg font-normal text-[#2C2C2C]">
          Linked Sector Opportunities
        </h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          Link this strategy to sector opportunities. The order determines
          priority. Linked sectors appear on the published strategy detail page.
        </p>

        {/* Current links */}
        {linkedSectorIds.length > 0 ? (
          <ul
            className="space-y-2 list-none p-0 m-0"
            data-testid="linked-sectors-list"
          >
            {linkedSectorIds.map((sid, idx) => (
              <li
                key={sid}
                className="flex items-center gap-2 bg-[#FAF9F7] border border-[#E8E6E3] px-3 py-2"
              >
                <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium w-5 shrink-0 text-center">
                  {idx + 1}
                </span>
                <Link
                  href={`/sectors/${sid}`}
                  className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 min-w-0 truncate"
                >
                  {sectorNameById.get(sid) ?? sid}
                </Link>
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSectorLink(sid, "up")}
                    disabled={idx === 0}
                    aria-label={`Move ${sectorNameById.get(sid) ?? sid} up`}
                    className="px-1.5 py-0.5 text-xs text-[#6B6B6B] hover:text-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSectorLink(sid, "down")}
                    disabled={idx === linkedSectorIds.length - 1}
                    aria-label={`Move ${sectorNameById.get(sid) ?? sid} down`}
                    className="px-1.5 py-0.5 text-xs text-[#6B6B6B] hover:text-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSectorLink(sid)}
                    aria-label={`Remove ${sectorNameById.get(sid) ?? sid}`}
                    className="px-1.5 py-0.5 text-xs text-red-500 hover:text-red-700 transition"
                    data-testid={`remove-sector-${sid}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#9A9A9A] italic">
            No sector opportunities linked yet.
          </p>
        )}

        {/* Add sector selector */}
        {!sectorsLoading && unlinkedSectors.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={sectorPickerId} className={labelClass}>
                Add sector opportunity
              </label>
              <select
                id={sectorPickerId}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    addSectorLink(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="mt-1 w-full h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
                data-testid="add-sector-select"
              >
                <option value="" disabled>
                  Select a sector opportunity…
                </option>
                {unlinkedSectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {sectorsLoading && (
          <p className="text-xs text-[#9A9A9A]">Loading sector opportunities…</p>
        )}

        {!sectorsLoading && availableSectors.length === 0 && (
          <p className="text-xs text-[#9A9A9A] italic">
            No sector opportunities available in the system.
          </p>
        )}
      </section>

      {/* AI Grading section */}
      {(extraction || COMPONENT_IDS.some((cid) => components[cid]?.trim())) && (
        <section
          className="bg-white border border-[#E8E6E3] p-5 space-y-4"
          data-testid="grading-section"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-normal text-[#2C2C2C]">
                Strategy Grade
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                {gradeResult
                  ? `Graded: ${gradeResult.gradeLetter} — you can re-grade after making edits.`
                  : "Grade this strategy against the six-component blueprint."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGrade}
              disabled={isGrading}
              className="shrink-0 px-4 py-2 text-sm bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out disabled:opacity-50"
              data-testid="run-grading-btn"
            >
              {isGrading
                ? "Grading…"
                : gradeResult
                  ? "Re-grade"
                  : "Run AI grading"}
            </button>
          </div>

          {isGrading && (
            <div className="flex items-center gap-3" role="status">
              <svg
                className="h-5 w-5 animate-spin text-[#7A6B5A]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  className="opacity-75"
                />
              </svg>
              <p className="text-sm text-[#2C2C2C]">
                Saving draft and evaluating against the blueprint…
              </p>
            </div>
          )}

          {gradeError && (
            <div
              className="bg-red-50 border border-red-200 px-4 py-3 space-y-2"
              role="alert"
            >
              <p className="text-sm text-red-800">{gradeError}</p>
              <button
                type="button"
                onClick={handleGrade}
                className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900"
              >
                Retry grading
              </button>
            </div>
          )}

          {gradeResult && (
            <div className="space-y-4 pt-2" data-testid="grade-result">
              {/* Grading warnings */}
              {gradeResult.warnings && gradeResult.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
                  <p className="text-xs font-medium text-amber-800">
                    Grading completed with {gradeResult.warnings.length}{" "}
                    {gradeResult.warnings.length === 1 ? "warning" : "warnings"}:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {gradeResult.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grade summary */}
              <div className="flex items-start gap-4">
                <div
                  className={`flex items-center justify-center w-14 h-14 text-xl font-heading font-medium shrink-0 ${gradeColourClass(gradeResult.gradeLetter)}`}
                >
                  {gradeResult.gradeLetter}
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={labelClass}>Grade rationale</p>
                  <p className={bodyClass}>
                    {gradeResult.gradeRationaleShort}
                  </p>
                </div>
              </div>

              {/* Scope discipline */}
              {gradeResult.scopeDisciplineNotes && (
                <div>
                  <p className={labelClass}>Scope discipline</p>
                  <p className={`${bodyClass} mt-1`}>
                    {gradeResult.scopeDisciplineNotes}
                  </p>
                </div>
              )}

              {/* Evidence by component */}
              <div className="border-t border-[#E8E6E3] pt-4">
                <p className={`${labelClass} mb-3`}>
                  Evidence by blueprint component
                </p>
                <div className="space-y-3">
                  {COMPONENT_IDS.map((cid) => {
                    const note = gradeResult.evidenceNotesByComponent[cid];
                    if (!note) return null;
                    return (
                      <div
                        key={cid}
                        className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5"
                      >
                        <span className="text-xs font-medium text-[#2C2C2C] whitespace-nowrap">
                          {cid}. {STRATEGY_COMPONENT_NAMES[cid]}
                        </span>
                        <span />
                        <span />
                        <p className={bodyClass}>{note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Missing elements */}
              {gradeResult.missingElements.length > 0 && (
                <div className="border-t border-[#E8E6E3] pt-4">
                  <p className={`${labelClass} mb-2`}>Missing elements</p>
                  <ul className="space-y-1 list-none p-0 m-0">
                    {gradeResult.missingElements.map((me, i) => (
                      <li key={i} className={bodyClass}>
                        <span className="font-medium">
                          Component {me.componentId}:
                        </span>{" "}
                        {me.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Extracted text reference */}
      {initial.extractedText && (
        <details className="bg-white border border-[#E8E6E3]">
          <summary className="px-5 py-3 cursor-pointer text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium hover:bg-[#F5F3F0] transition duration-200 select-none">
            Source text{" "}
            {textStats && (
              <span className="ml-1 text-[10px] tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]">
                {textStats.words.toLocaleString()} words
              </span>
            )}
          </summary>
          <div
            className="max-h-96 overflow-auto bg-[#FAF9F7] border-t border-[#E8E6E3] p-4"
            data-testid="extracted-text"
          >
            <pre className="text-xs text-[#2C2C2C] whitespace-pre-wrap font-mono leading-relaxed">
              {initial.extractedText}
            </pre>
          </div>
        </details>
      )}

      {/* Bottom action bar */}
      <div className="flex items-center justify-between gap-4 py-4 border-t border-[#E8E6E3]">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm border border-[#E8E6E3] bg-white text-[#2C2C2C] hover:bg-[#F5F3F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] transition duration-300 ease-out disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing || isSaving}
          className="px-4 py-2 text-sm bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out disabled:opacity-50"
        >
          {isPublishing ? "Publishing…" : "Accept and publish"}
        </button>
      </div>
    </div>
  );
}
