"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Deal, LGA, OpportunityType } from "@/lib/types";
import {
  saveDealLocally,
  saveOpportunityTypeLocally,
  getAllOpportunityTypes,
} from "@/lib/deal-storage";
import {
  STAGE_LABELS,
  READINESS_LABELS,
  CONSTRAINT_LABELS,
} from "@/lib/labels";
import {
  STAGE_COLOUR_CLASSES,
  READINESS_COLOUR_CLASSES,
} from "@/lib/stage-colours";
import {
  extractTextFromFile,
  ACCEPTED_EXTENSIONS,
} from "@/lib/extract-text";
import type { MemoAnalysisResult } from "@/app/api/deals/analyse-memo/route";

// =============================================================================
// Props
// =============================================================================

export interface InvestmentMemoProps {
  deals: Deal[];
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
}

// =============================================================================
// Component
// =============================================================================

export function InvestmentMemo({
  opportunityTypes,
}: InvestmentMemoProps) {
  const router = useRouter();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractedTextRef = useRef<string>("");

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Processing state (covers both extraction and analysis)
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "extracting" | "analysing" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<MemoAnalysisResult | null>(null);
  const [dealName, setDealName] = useState("");
  const [applied, setApplied] = useState(false);
  const [newDealId, setNewDealId] = useState<string | null>(null);

  // Opportunity type state
  const [selectedOtId, setSelectedOtId] = useState<string>("");
  const [isOverridingOt, setIsOverridingOt] = useState(false);
  const [isCreatingNewOt, setIsCreatingNewOt] = useState(false);
  const [newOtName, setNewOtName] = useState("");
  const [newOtDefinition, setNewOtDefinition] = useState("");

  /** All opportunity types including locally-created ones. */
  const allOpportunityTypes = getAllOpportunityTypes(opportunityTypes);

  /** Serialisable catalogue for the API request. */
  const otCatalogue = allOpportunityTypes.map((ot) => ({
    id: ot.id,
    name: ot.name,
    definition: ot.definition,
  }));

  /** Apply the AI's opportunity type suggestion to local state. */
  const applyOtSuggestion = useCallback(
    (suggestion: MemoAnalysisResult["suggestedOpportunityType"]) => {
      setIsOverridingOt(false);
      setIsCreatingNewOt(false);
      setNewOtName("");
      setNewOtDefinition("");
      if (suggestion.existingId) {
        // AI matched an existing type — pre-select it
        setSelectedOtId(suggestion.existingId);
      } else if (suggestion.proposedName && suggestion.closestExistingId) {
        // AI proposed new but also has a closest existing — default to closest,
        // user will see a choice between the two
        setSelectedOtId(suggestion.closestExistingId);
      } else if (suggestion.proposedName) {
        // AI proposed new with no closest — pre-fill the create form
        setIsCreatingNewOt(true);
        setNewOtName(suggestion.proposedName);
        setNewOtDefinition(suggestion.proposedDefinition ?? "");
        setSelectedOtId("");
        setIsOverridingOt(true);
      } else {
        // No suggestion — show override mode so user can pick manually
        setIsOverridingOt(true);
        setSelectedOtId("");
      }
    },
    []
  );

  // --- Analyse extracted text via API ---
  const analyseText = useCallback(
    async (text: string, fileName: string) => {
      setIsProcessing(true);
      setProcessingStep("analysing");
      setResult(null);
      setError(null);
      setApplied(false);
      setNewDealId(null);
      setDealName("");
      setSelectedOtId("");
      setIsOverridingOt(false);
      setIsCreatingNewOt(false);
      setNewOtName("");
      setNewOtDefinition("");

      try {
        const res = await fetch("/api/deals/analyse-memo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memoText: text.trim(),
            memoLabel: fileName || undefined,
            opportunityTypes: otCatalogue,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ??
              `Request failed (${res.status})`
          );
        }

        const data = (await res.json()) as MemoAnalysisResult;
        setResult(data);
        setDealName(data.name || "Untitled Deal");
        applyOtSuggestion(data.suggestedOpportunityType);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setIsProcessing(false);
        setProcessingStep(null);
      }
    },
    []
  );

  // --- Process file: extract text then immediately analyse ---
  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      extractedTextRef.current = "";
      setResult(null);
      setError(null);
      setApplied(false);
      setNewDealId(null);
      setDealName("");
      setSelectedOtId("");
      setIsOverridingOt(false);
      setIsCreatingNewOt(false);
      setNewOtName("");
      setNewOtDefinition("");
      setIsProcessing(true);

      try {
        // Step 1: Extract text
        setProcessingStep("extracting");
        const text = await extractTextFromFile(f);
        if (!text.trim()) {
          throw new Error("No text could be extracted from this file.");
        }
        extractedTextRef.current = text;

        // Step 2: Analyse via API
        setProcessingStep("analysing");
        const res = await fetch("/api/deals/analyse-memo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memoText: text.trim(),
            memoLabel: f.name || undefined,
            opportunityTypes: otCatalogue,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ??
              `Request failed (${res.status})`
          );
        }

        const data = (await res.json()) as MemoAnalysisResult;
        setResult(data);
        setDealName(data.name || "Untitled Deal");
        applyOtSuggestion(data.suggestedOpportunityType);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setIsProcessing(false);
        setProcessingStep(null);
      }
    },
    []
  );

  // --- Retry analysis (skips extraction, reuses cached text) ---
  const handleRetry = useCallback(() => {
    if (extractedTextRef.current && file) {
      analyseText(extractedTextRef.current, file.name);
    } else if (file) {
      processFile(file);
    }
  }, [file, analyseText, processFile]);

  // --- Drop handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) processFile(dropped);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    extractedTextRef.current = "";
    setResult(null);
    setError(null);
    setApplied(false);
    setNewDealId(null);
    setDealName("");
    setSelectedOtId("");
    setIsOverridingOt(false);
    setIsCreatingNewOt(false);
    setNewOtName("");
    setNewOtDefinition("");
    setIsProcessing(false);
    setProcessingStep(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // --- Create deal handler ---
  const handleCreateDeal = useCallback(() => {
    if (!result) return;

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `deal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const name = dealName.trim() || result.name || "Untitled Deal";

    // Resolve opportunity type — create new if needed
    let otId: string;
    if (isCreatingNewOt && newOtName.trim()) {
      const newOtId = newOtName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const newOt: OpportunityType = {
        id: newOtId,
        name: newOtName.trim(),
        definition: newOtDefinition.trim() || "",
        economicFunction: "",
        typicalCapitalStack: "",
        typicalRisks: "",
      };
      saveOpportunityTypeLocally(newOt);
      otId = newOtId;
    } else {
      otId = selectedOtId || allOpportunityTypes[0]?.id || "unknown";
    }

    const newDeal: Deal = {
      id,
      name,
      opportunityTypeId: otId,
      lgaIds: [],
      stage: result.stage,
      readinessState: result.readinessState,
      dominantConstraint: result.dominantConstraint,
      summary: result.summary,
      description: result.description || undefined,
      nextStep: result.nextStep || "",
      investmentValue: result.investmentValue,
      economicImpact: result.economicImpact,
      keyStakeholders: result.keyStakeholders,
      risks: result.risks,
      strategicActions: result.strategicActions,
      infrastructureNeeds: result.infrastructureNeeds,
      skillsImplications: result.skillsImplications,
      marketDrivers: result.marketDrivers,
      governmentPrograms: result.governmentPrograms,
      timeline: result.timeline,
      evidence: [
        {
          label: result.memoReference.label,
          pageRef: result.memoReference.pageRef,
        },
      ],
      notes: [],
      gateChecklist: {},
      artefacts: {},
      updatedAt: new Date().toISOString(),
    };

    saveDealLocally(newDeal);
    setNewDealId(id);
    setApplied(true);
  }, [result, dealName, selectedOtId, isCreatingNewOt, newOtName, newOtDefinition, allOpportunityTypes]);

  // --- Helpers ---
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-normal text-[#2C2C2C] mb-1">
          New Deal from Document
        </h2>
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-prose">
          Upload an investment memo or strategy document. AI will extract a
          deal name, determine the stage, and populate all fields
          automatically.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ── Left: Upload ────────────────────────────── */}
        <div className="space-y-5">
          {/* File upload area */}
          <div>
            <p className="block text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1.5">
              Document
            </p>

            {!file ? (
              <div
                data-testid="drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Upload document"
                className={`
                  w-full border-2 border-dashed px-4 py-10 text-center cursor-pointer
                  transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2
                  ${
                    isDragging
                      ? "border-[#7A6B5A] bg-amber-50/40"
                      : "border-[#E8E6E3] bg-[#FAF9F7] hover:border-[#C8C4BF] hover:bg-white"
                  }
                `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="mx-auto h-8 w-8 text-[#C8C4BF] mb-3"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                </svg>
                <p className="text-sm text-[#6B6B6B]">
                  <span className="text-[#7A6B5A] font-medium">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-[10px] text-[#999] mt-1.5">
                  PDF, TXT, MD, or CSV (max 20 MB)
                </p>
              </div>
            ) : (
              <div className="border border-[#E8E6E3] bg-white px-4 py-3 flex items-center gap-3">
                <div className="shrink-0 h-10 w-10 bg-[#F5F3F0] border border-[#E8E6E3] flex items-center justify-center">
                  <span className="text-[10px] font-medium uppercase text-[#6B6B6B]">
                    {file.name.split(".").pop()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-[#2C2C2C] truncate"
                    data-testid="file-name"
                  >
                    {file.name}
                  </p>
                  <p className="text-[10px] text-[#999]">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  aria-label="Remove file"
                  className="shrink-0 text-[#999] hover:text-[#2C2C2C] transition-colors p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="sr-only"
              data-testid="file-input"
              aria-label="Upload document"
            />
          </div>

          {/* Error with retry */}
          {error && (
            <div className="space-y-3">
              <p
                className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2"
                role="alert"
              >
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="w-full text-sm font-medium py-2.5 px-4 bg-[#2C2C2C] text-white hover:bg-[#444] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-2"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Processing / Results ──────────────── */}
        <div className="lg:sticky lg:top-20">
          {/* Processing indicator */}
          {isProcessing && (
            <div className="bg-white border border-[#E8E6E3] p-8 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="inline-block h-6 w-6 border-2 border-[#E8E6E3] border-t-[#2C2C2C] rounded-full animate-spin" />
                <p className="text-sm text-[#6B6B6B]" data-testid="processing-status">
                  {processingStep === "extracting"
                    ? "Extracting text from document…"
                    : "Analysing document with AI…"}
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isProcessing && (
            <div className="bg-white border border-[#E8E6E3] divide-y divide-[#E8E6E3]">
              {/* Deal name (editable) */}
              <div className="p-5 space-y-3">
                <label
                  htmlFor="deal-name"
                  className="block text-[10px] uppercase tracking-wider text-[#6B6B6B]"
                >
                  Deal name
                </label>
                <input
                  id="deal-name"
                  type="text"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  disabled={applied}
                  className="w-full font-heading text-lg font-normal text-[#2C2C2C] bg-transparent border-b border-[#E8E6E3] pb-1 focus:outline-none focus:border-[#7A6B5A] disabled:opacity-70 disabled:cursor-not-allowed"
                />

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[result.stage]}`}
                  >
                    {STAGE_LABELS[result.stage]}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${READINESS_COLOUR_CLASSES[result.readinessState]}`}
                  >
                    {READINESS_LABELS[result.readinessState]}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]">
                    {CONSTRAINT_LABELS[result.dominantConstraint]}
                  </span>
                </div>
              </div>

              {/* Opportunity type — progressive disclosure */}
              <div className="p-5 space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Opportunity type
                </p>

                {(() => {
                  const sug = result.suggestedOpportunityType;
                  const hasProposedWithClosest =
                    !sug.existingId && sug.proposedName && sug.closestExistingId;
                  const closestOt = hasProposedWithClosest
                    ? allOpportunityTypes.find((ot) => ot.id === sug.closestExistingId)
                    : null;

                  /* ── State A: AI matched an existing type ── */
                  if (sug.existingId && !isOverridingOt) {
                    const matched = allOpportunityTypes.find((ot) => ot.id === sug.existingId);
                    return (
                      <div className="space-y-2">
                        {matched && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#2C2C2C]">
                              {matched.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border bg-emerald-50 text-emerald-700 border-emerald-200">
                              AI recommended
                            </span>
                          </div>
                        )}
                        {sug.reasoning && (
                          <p className="text-xs text-[#6B6B6B] leading-relaxed italic">
                            {sug.reasoning}
                          </p>
                        )}
                        {!applied && (
                          <button
                            type="button"
                            onClick={() => setIsOverridingOt(true)}
                            className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A]"
                          >
                            Not a good fit? Choose another
                          </button>
                        )}
                      </div>
                    );
                  }

                  /* ── State B: AI proposed new + closest existing — show choice ── */
                  if (hasProposedWithClosest && closestOt && !isOverridingOt) {
                    return (
                      <div className="space-y-3">
                        {sug.reasoning && (
                          <p className="text-xs text-[#6B6B6B] leading-relaxed italic">
                            AI: {sug.reasoning}
                          </p>
                        )}

                        {/* Option A: Closest existing */}
                        <button
                          type="button"
                          disabled={applied}
                          onClick={() => {
                            setSelectedOtId(sug.closestExistingId!);
                            setIsCreatingNewOt(false);
                            setNewOtName("");
                            setNewOtDefinition("");
                          }}
                          className={`w-full text-left p-3 border transition duration-200 ${
                            selectedOtId === sug.closestExistingId && !isCreatingNewOt
                              ? "border-[#7A6B5A] bg-white"
                              : "border-[#E8E6E3] bg-[#FAF9F7] hover:border-[#C8C4BF]"
                          } disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[#2C2C2C]">
                              {closestOt.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border bg-amber-50 text-amber-700 border-amber-200">
                              Closest existing
                            </span>
                          </div>
                          {sug.closestExistingReasoning && (
                            <p className="text-xs text-[#6B6B6B] leading-relaxed">
                              {sug.closestExistingReasoning}
                            </p>
                          )}
                        </button>

                        {/* Option B: Proposed new */}
                        <button
                          type="button"
                          disabled={applied}
                          onClick={() => {
                            setSelectedOtId("");
                            setIsCreatingNewOt(true);
                            setNewOtName(sug.proposedName!);
                            setNewOtDefinition(sug.proposedDefinition ?? "");
                          }}
                          className={`w-full text-left p-3 border transition duration-200 ${
                            isCreatingNewOt
                              ? "border-[#7A6B5A] bg-white"
                              : "border-[#E8E6E3] bg-[#FAF9F7] hover:border-[#C8C4BF]"
                          } disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[#2C2C2C]">
                              {sug.proposedName}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border bg-[#F5F3F0] text-[#6B6B6B] border-[#E8E6E3]">
                              New type
                            </span>
                          </div>
                          {sug.proposedDefinition && (
                            <p className="text-xs text-[#6B6B6B] leading-relaxed">
                              {sug.proposedDefinition}
                            </p>
                          )}
                        </button>

                        {/* Editable fields when "new type" is selected */}
                        {isCreatingNewOt && !applied && (
                          <div className="space-y-2 pl-3 border-l-2 border-[#E8E6E3]">
                            <input
                              type="text"
                              value={newOtName}
                              onChange={(e) => setNewOtName(e.target.value)}
                              placeholder="Broad sector name (e.g. Agriculture)"
                              className="w-full h-8 px-2 border border-[#E8E6E3] bg-white text-sm text-[#2C2C2C] placeholder:text-[#999] focus:border-[#7A6B5A] focus:outline-none"
                            />
                            <textarea
                              value={newOtDefinition}
                              onChange={(e) => setNewOtDefinition(e.target.value)}
                              placeholder="Definition (1-2 sentences)"
                              rows={2}
                              className="w-full px-2 py-1.5 border border-[#E8E6E3] bg-white text-sm text-[#2C2C2C] placeholder:text-[#999] focus:border-[#7A6B5A] focus:outline-none resize-none"
                            />
                          </div>
                        )}

                        {!applied && (
                          <button
                            type="button"
                            onClick={() => setIsOverridingOt(true)}
                            className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A]"
                          >
                            Neither — choose a different type
                          </button>
                        )}
                      </div>
                    );
                  }

                  /* ── State C: Override mode — full selector + create new ── */
                  return (
                    <div className="space-y-3">
                      {!isCreatingNewOt ? (
                        <div className="space-y-2">
                          <select
                            id="opportunity-type"
                            value={selectedOtId}
                            onChange={(e) => setSelectedOtId(e.target.value)}
                            disabled={applied}
                            className="w-full h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            <option value="">Select opportunity type…</option>
                            {allOpportunityTypes.map((ot) => (
                              <option key={ot.id} value={ot.id}>
                                {ot.name}
                              </option>
                            ))}
                          </select>
                          {!applied && (
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingNewOt(true);
                                  setSelectedOtId("");
                                }}
                                className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A]"
                              >
                                + Create new type
                              </button>
                              {(sug.existingId || sug.closestExistingId) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOverridingOt(false);
                                    setSelectedOtId(
                                      sug.existingId ?? sug.closestExistingId ?? ""
                                    );
                                    setIsCreatingNewOt(false);
                                  }}
                                  className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A]"
                                >
                                  Back to AI suggestions
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 bg-[#FAF9F7] border border-[#E8E6E3] p-3">
                          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                            New opportunity type
                          </p>
                          <input
                            type="text"
                            value={newOtName}
                            onChange={(e) => setNewOtName(e.target.value)}
                            disabled={applied}
                            placeholder="Broad sector name (e.g. Agriculture)"
                            className="w-full h-8 px-2 border border-[#E8E6E3] bg-white text-sm text-[#2C2C2C] placeholder:text-[#999] focus:border-[#7A6B5A] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                          <textarea
                            value={newOtDefinition}
                            onChange={(e) => setNewOtDefinition(e.target.value)}
                            disabled={applied}
                            placeholder="Definition (1-2 sentences describing this sector opportunity)"
                            rows={2}
                            className="w-full px-2 py-1.5 border border-[#E8E6E3] bg-white text-sm text-[#2C2C2C] placeholder:text-[#999] focus:border-[#7A6B5A] focus:outline-none resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                          {!applied && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewOt(false);
                                setNewOtName("");
                                setNewOtDefinition("");
                              }}
                              className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A]"
                            >
                              Choose existing type instead
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Summary */}
              <div className="p-5 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Summary
                </p>
                <p className="text-sm text-[#2C2C2C] leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Description */}
              {result.description && (
                <div className="p-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                    Description
                  </p>
                  {result.description.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      className="text-sm text-[#2C2C2C] leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Next step */}
              {result.nextStep && (
                <div className="p-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                    Recommended next step
                  </p>
                  <p className="text-sm text-[#2C2C2C] leading-relaxed">
                    {result.nextStep}
                  </p>
                </div>
              )}

              {/* Key fields grid */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {result.investmentValue && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-0.5">
                      Investment value
                    </p>
                    <p className="text-sm text-[#2C2C2C]">
                      {result.investmentValue}
                    </p>
                  </div>
                )}
                {result.economicImpact && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-0.5">
                      Economic impact
                    </p>
                    <p className="text-sm text-[#2C2C2C]">
                      {result.economicImpact}
                    </p>
                  </div>
                )}
                {result.keyStakeholders && result.keyStakeholders.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-0.5">
                      Key stakeholders
                    </p>
                    <p className="text-sm text-[#2C2C2C]">
                      {result.keyStakeholders.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Risks */}
              {result.risks && result.risks.length > 0 && (
                <div className="p-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                    Risks
                  </p>
                  <ul className="text-sm text-[#2C2C2C] leading-relaxed space-y-1 list-disc list-inside">
                    {result.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strategic actions */}
              {result.strategicActions &&
                result.strategicActions.length > 0 && (
                  <div className="p-5 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                      Strategic actions
                    </p>
                    <ul className="text-sm text-[#2C2C2C] leading-relaxed space-y-1 list-disc list-inside">
                      {result.strategicActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Government programs */}
              {result.governmentPrograms &&
                result.governmentPrograms.length > 0 && (
                  <div className="p-5 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                      Government programs
                    </p>
                    <ul className="text-sm text-[#2C2C2C] leading-relaxed space-y-1">
                      {result.governmentPrograms.map((gp, i) => (
                        <li key={i}>
                          <span className="font-medium">{gp.name}</span>
                          {gp.description && (
                            <span className="text-[#6B6B6B]">
                              {" "}
                              — {gp.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <div className="p-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                    Timeline
                  </p>
                  <ul className="text-sm text-[#2C2C2C] leading-relaxed space-y-1">
                    {result.timeline.map((m, i) => (
                      <li key={i}>
                        {m.label}
                        {m.date && (
                          <span className="text-[#6B6B6B]"> — {m.date}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action */}
              <div className="p-5">
                {applied && newDealId ? (
                  <Link
                    href={`/deals/${newDealId}`}
                    className="block w-full text-center text-sm font-medium py-2.5 px-4 bg-[#2C2C2C] text-white hover:bg-[#444] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-2"
                  >
                    Open deal &rarr;
                  </Link>
                ) : (
                  <button
                    onClick={handleCreateDeal}
                    disabled={
                      !dealName.trim() ||
                      (!selectedOtId && !isCreatingNewOt) ||
                      (isCreatingNewOt && !newOtName.trim())
                    }
                    className="w-full text-sm font-medium py-2.5 px-4 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                  >
                    Create deal
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !isProcessing && (
            <div className="bg-[#FAF9F7] border border-dashed border-[#E8E6E3] p-8 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-[#999] text-center max-w-[240px]">
                Upload a document to automatically extract and analyse deal
                information.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
