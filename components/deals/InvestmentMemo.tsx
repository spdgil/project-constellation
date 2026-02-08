"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Deal, LGA, OpportunityType } from "@/lib/types";
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
import type { MemoAnalysisResult } from "@/lib/ai/types";
import { logClientError, logClientWarn } from "@/lib/client-logger";

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
  lgas,
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

  // Editable draft fields (initialized from AI result, user can modify)
  const [draftSummary, setDraftSummary] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftNextStep, setDraftNextStep] = useState("");
  const [draftInvestmentValue, setDraftInvestmentValue] = useState("");
  const [draftEconomicImpact, setDraftEconomicImpact] = useState("");
  const [draftKeyStakeholders, setDraftKeyStakeholders] = useState("");
  const [draftRisks, setDraftRisks] = useState("");
  const [draftStrategicActions, setDraftStrategicActions] = useState("");
  const [draftInfrastructureNeeds, setDraftInfrastructureNeeds] = useState("");
  const [draftSkillsImplications, setDraftSkillsImplications] = useState("");
  const [draftMarketDrivers, setDraftMarketDrivers] = useState("");

  // LGA selection (AI always suggests at least one)
  const [draftLgaIds, setDraftLgaIds] = useState<string[]>([]);
  const [lgaSearch, setLgaSearch] = useState("");
  const [lgaDropdownOpen, setLgaDropdownOpen] = useState(false);

  // Location / geocoding state
  const [draftLocationText, setDraftLocationText] = useState("");
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLng, setDraftLng] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<
    "idle" | "pending" | "success" | "failed"
  >("idle");
  const [geocodeMatchedPlace, setGeocodeMatchedPlace] = useState<string | null>(null);

  /** Geocode a location string via the server-side API. */
  const geocodeLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGeocodeStatus("idle");
      return;
    }
    setIsGeocoding(true);
    setGeocodeStatus("pending");
    setDraftLat(null);
    setDraftLng(null);
    setGeocodeMatchedPlace(null);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = (await res.json()) as {
        lat: number | null;
        lng: number | null;
        confidence: string | null;
        matchedPlace: string | null;
      };
      if (data.lat !== null && data.lng !== null) {
        setDraftLat(data.lat);
        setDraftLng(data.lng);
        setGeocodeMatchedPlace(data.matchedPlace);
        setGeocodeStatus("success");
      } else {
        setGeocodeStatus("failed");
      }
    } catch {
      setGeocodeStatus("failed");
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  /** Populate draft fields from AI result. */
  const populateDraft = useCallback((r: MemoAnalysisResult) => {
    setDealName(r.name || "Untitled Deal");
    setDraftSummary(r.summary || "");
    setDraftDescription(r.description || "");
    setDraftNextStep(r.nextStep || "");
    setDraftInvestmentValue(r.investmentValue || "");
    setDraftEconomicImpact(r.economicImpact || "");
    setDraftLgaIds(r.suggestedLgaIds?.length ? r.suggestedLgaIds : ["mackay"]);
    setDraftKeyStakeholders(r.keyStakeholders?.join(", ") || "");
    setDraftRisks(r.risks?.join("\n") || "");
    setDraftStrategicActions(r.strategicActions?.join("\n") || "");
    setDraftInfrastructureNeeds(r.infrastructureNeeds?.join("\n") || "");
    setDraftSkillsImplications(r.skillsImplications || "");
    setDraftMarketDrivers(r.marketDrivers || "");

    // Location text — auto-geocode if AI provided it
    const locationText = r.suggestedLocationText || "";
    setDraftLocationText(locationText);
    setDraftLat(null);
    setDraftLng(null);
    setGeocodeStatus("idle");
    setGeocodeMatchedPlace(null);
    if (locationText) {
      geocodeLocation(locationText);
    }
  }, [geocodeLocation]);

  // Opportunity type state
  const [selectedOtId, setSelectedOtId] = useState<string>("");
  const [isOverridingOt, setIsOverridingOt] = useState(false);
  const [isCreatingNewOt, setIsCreatingNewOt] = useState(false);
  const [newOtName, setNewOtName] = useState("");
  const [newOtDefinition, setNewOtDefinition] = useState("");

  /** All opportunity types (now loaded from DB via server component). */
  const [allOpportunityTypes, setAllOpportunityTypes] = useState(opportunityTypes);

  /** Serialisable catalogue for the API request. */
  const otCatalogue = allOpportunityTypes.map((ot) => ({
    id: ot.id,
    name: ot.name,
    definition: ot.definition,
  }));

  /** LGA catalogue for the API request. */
  const lgaCatalogue = lgas.map((l) => ({ id: l.id, name: l.name }));

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
            lgas: lgaCatalogue,
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
        populateDraft(data);
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
            lgas: lgaCatalogue,
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
        populateDraft(data);
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
    setDraftSummary("");
    setDraftDescription("");
    setDraftNextStep("");
    setDraftInvestmentValue("");
    setDraftEconomicImpact("");
    setDraftLgaIds([]);
    setLgaSearch("");
    setLgaDropdownOpen(false);
    setDraftLocationText("");
    setDraftLat(null);
    setDraftLng(null);
    setIsGeocoding(false);
    setGeocodeStatus("idle");
    setGeocodeMatchedPlace(null);
    setDraftKeyStakeholders("");
    setDraftRisks("");
    setDraftStrategicActions("");
    setDraftInfrastructureNeeds("");
    setDraftSkillsImplications("");
    setDraftMarketDrivers("");
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
  const handleCreateDeal = useCallback(async () => {
    if (!result) return;

    const name = dealName.trim() || result.name || "Untitled Deal";

    // Resolve opportunity type — create new via API if needed
    let otId: string;
    if (isCreatingNewOt && newOtName.trim()) {
      try {
        const otRes = await fetch("/api/opportunity-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newOtName.trim(),
            definition: newOtDefinition.trim() || "",
          }),
        });
        if (otRes.ok) {
          const newOt = (await otRes.json()) as OpportunityType;
          otId = newOt.id;
          // Add to local list so it appears in the dropdown
          setAllOpportunityTypes((prev) => [...prev, newOt]);
        } else {
          logClientError(
            "Failed to create opportunity type",
            undefined,
            "InvestmentMemo",
          );
          return;
        }
      } catch (error) {
        logClientError(
          "Failed to create opportunity type",
          { error: String(error) },
          "InvestmentMemo",
        );
        return;
      }
    } else {
      otId = selectedOtId || allOpportunityTypes[0]?.id || "unknown";
    }

    // Parse list fields from draft (newline-separated)
    const parseList = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    // Create the deal via API
    const dealBody: Record<string, unknown> = {
      name,
      opportunityTypeId: otId,
      lgaIds: draftLgaIds.length > 0 ? draftLgaIds : result.suggestedLgaIds,
      ...(draftLat !== null && draftLng !== null ? { lat: draftLat, lng: draftLng } : {}),
      stage: result.stage,
      readinessState: result.readinessState,
      dominantConstraint: result.dominantConstraint,
      summary: draftSummary.trim() || result.summary,
      description: draftDescription.trim() || result.description || undefined,
      nextStep: draftNextStep.trim() || result.nextStep || "",
      investmentValue: draftInvestmentValue.trim() || result.investmentValue,
      economicImpact: draftEconomicImpact.trim() || result.economicImpact,
      keyStakeholders: draftKeyStakeholders.trim()
        ? draftKeyStakeholders.split(",").map((s) => s.trim()).filter(Boolean)
        : result.keyStakeholders,
      risks: draftRisks.trim() ? parseList(draftRisks) : result.risks,
      strategicActions: draftStrategicActions.trim()
        ? parseList(draftStrategicActions)
        : result.strategicActions,
      infrastructureNeeds: draftInfrastructureNeeds.trim()
        ? parseList(draftInfrastructureNeeds)
        : result.infrastructureNeeds,
      skillsImplications:
        draftSkillsImplications.trim() || result.skillsImplications,
      marketDrivers: draftMarketDrivers.trim() || result.marketDrivers,
      governmentPrograms: result.governmentPrograms,
      timeline: result.timeline,
      evidence: [
        {
          label: result.memoReference.label,
          pageRef: result.memoReference.pageRef,
        },
      ],
    };

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealBody),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed to create deal (${res.status})`);
      }

      const { id: newId } = (await res.json()) as { id: string };

      // Upload document to the new deal if a file was uploaded
      if (file) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("label", result.memoReference?.label || file.name);
          await fetch(`/api/deals/${newId}/documents`, {
            method: "POST",
            body: formData,
          });
        } catch (error) {
          // Deal was created, document upload failed — not fatal
          logClientWarn(
            "Document upload failed, deal was still created.",
            { error: String(error) },
            "InvestmentMemo",
          );
        }
      }

      setNewDealId(newId);
      setApplied(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create deal."
      );
    }
  }, [
    result, file, dealName, selectedOtId, isCreatingNewOt, newOtName,
    newOtDefinition, allOpportunityTypes,
    draftSummary, draftDescription, draftNextStep, draftInvestmentValue,
    draftEconomicImpact, draftLgaIds, draftLat, draftLng,
    draftKeyStakeholders, draftRisks,
    draftStrategicActions, draftInfrastructureNeeds, draftSkillsImplications,
    draftMarketDrivers,
  ]);

  // --- Helpers ---
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
        Upload an investment memo or strategy document. AI will extract the
        deal details and populate all fields automatically.
      </p>

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

              {/* --- Editable fields --- */}

              {/* LGA assignment — searchable multi-select */}
              <div className="p-5 space-y-2">
                <label htmlFor="draft-lga-search" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  LGA <span className="text-red-600">*</span>
                </label>

                {/* Selected LGA chips */}
                {draftLgaIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draftLgaIds.map((id) => {
                      const lgaName = lgas.find((l) => l.id === id)?.name ?? id;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-[#7A6B5A] text-white rounded"
                        >
                          {lgaName}
                          {!applied && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftLgaIds((prev) => prev.filter((x) => x !== id))
                              }
                              className="hover:text-red-200 ml-0.5"
                              aria-label={`Remove ${lgaName}`}
                            >
                              &times;
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Searchable dropdown */}
                {!applied && (
                  <div className="relative">
                    <input
                      id="draft-lga-search"
                      type="text"
                      value={lgaSearch}
                      onChange={(e) => {
                        setLgaSearch(e.target.value);
                        setLgaDropdownOpen(true);
                      }}
                      onFocus={() => setLgaDropdownOpen(true)}
                      placeholder="Search LGAs…"
                      className="w-full text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1"
                    />
                    {lgaDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-[#E8E6E3] shadow-lg rounded">
                        {lgas
                          .filter(
                            (l) =>
                              !draftLgaIds.includes(l.id) &&
                              l.name
                                .toLowerCase()
                                .includes(lgaSearch.toLowerCase())
                          )
                          .map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setDraftLgaIds((prev) => [...prev, l.id]);
                                setLgaSearch("");
                                setLgaDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-[#2C2C2C] hover:bg-[#FAF9F7] transition-colors"
                            >
                              {l.name}
                            </button>
                          ))}
                        {lgas.filter(
                          (l) =>
                            !draftLgaIds.includes(l.id) &&
                            l.name.toLowerCase().includes(lgaSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="px-3 py-2 text-xs text-[#999]">No matching LGAs</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {draftLgaIds.length === 0 && (
                  <p className="text-xs text-red-600">At least one LGA is required</p>
                )}
              </div>

              {/* Location (geocoding) */}
              <div className="p-5 space-y-2">
                <label htmlFor="draft-location" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    id="draft-location"
                    type="text"
                    value={draftLocationText}
                    onChange={(e) => setDraftLocationText(e.target.value)}
                    disabled={applied}
                    className="flex-1 text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    placeholder="e.g. Paget Industrial Estate, Mackay, QLD"
                  />
                  {!applied && (
                    <button
                      type="button"
                      disabled={isGeocoding || !draftLocationText.trim()}
                      onClick={() => geocodeLocation(draftLocationText)}
                      className="shrink-0 text-xs px-3 py-2 border border-[#E8E6E3] bg-[#FAF9F7] text-[#6B6B6B] hover:border-[#C8C4BF] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGeocoding ? "Geocoding…" : "Geocode"}
                    </button>
                  )}
                </div>

                {/* Status */}
                {geocodeStatus === "pending" && (
                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 border border-[#E8E6E3] border-t-[#2C2C2C] rounded-full animate-spin" />
                    Geocoding location…
                  </p>
                )}
                {geocodeStatus === "success" && draftLat !== null && draftLng !== null && (
                  <p className="text-xs text-emerald-700">
                    Geocoded to {draftLat.toFixed(4)}, {draftLng.toFixed(4)}
                    {geocodeMatchedPlace && (
                      <span className="text-[#6B6B6B]"> — {geocodeMatchedPlace}</span>
                    )}
                  </p>
                )}
                {geocodeStatus === "failed" && (
                  <p className="text-xs text-amber-700">
                    Could not geocode — the deal will use the LGA centroid as a fallback
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-summary" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Summary
                </label>
                <textarea
                  id="draft-summary"
                  value={draftSummary}
                  onChange={(e) => setDraftSummary(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                />
              </div>

              {/* Description */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-description" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Description
                </label>
                <textarea
                  id="draft-description"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={5}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                />
              </div>

              {/* Next step */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-next-step" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Recommended next step
                </label>
                <input
                  id="draft-next-step"
                  type="text"
                  value={draftNextStep}
                  onChange={(e) => setDraftNextStep(e.target.value)}
                  className="w-full text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1"
                />
              </div>

              {/* Key fields grid */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label htmlFor="draft-investment-value" className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-0.5 block">
                    Investment value
                  </label>
                  <input
                    id="draft-investment-value"
                    type="text"
                    value={draftInvestmentValue}
                    onChange={(e) => setDraftInvestmentValue(e.target.value)}
                    className="w-full text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label htmlFor="draft-economic-impact" className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-0.5 block">
                    Economic impact
                  </label>
                  <input
                    id="draft-economic-impact"
                    type="text"
                    value={draftEconomicImpact}
                    onChange={(e) => setDraftEconomicImpact(e.target.value)}
                    className="w-full text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="draft-key-stakeholders" className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-0.5 block">
                    Key stakeholders
                    <span className="normal-case text-[#999] ml-1">(comma-separated)</span>
                  </label>
                  <input
                    id="draft-key-stakeholders"
                    type="text"
                    value={draftKeyStakeholders}
                    onChange={(e) => setDraftKeyStakeholders(e.target.value)}
                    className="w-full text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1"
                    placeholder="e.g. Department of Agriculture, Local Council"
                  />
                </div>
              </div>

              {/* Risks */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-risks" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Risks
                  <span className="normal-case text-[#999] ml-1">(one per line)</span>
                </label>
                <textarea
                  id="draft-risks"
                  value={draftRisks}
                  onChange={(e) => setDraftRisks(e.target.value)}
                  rows={4}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                  placeholder="One risk per line"
                />
              </div>

              {/* Strategic actions */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-strategic-actions" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Strategic actions
                  <span className="normal-case text-[#999] ml-1">(one per line)</span>
                </label>
                <textarea
                  id="draft-strategic-actions"
                  value={draftStrategicActions}
                  onChange={(e) => setDraftStrategicActions(e.target.value)}
                  rows={4}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                  placeholder="One action per line"
                />
              </div>

              {/* Infrastructure needs */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-infrastructure-needs" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Infrastructure needs
                  <span className="normal-case text-[#999] ml-1">(one per line)</span>
                </label>
                <textarea
                  id="draft-infrastructure-needs"
                  value={draftInfrastructureNeeds}
                  onChange={(e) => setDraftInfrastructureNeeds(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                  placeholder="One need per line"
                />
              </div>

              {/* Skills implications */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-skills-implications" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Skills &amp; workforce implications
                </label>
                <textarea
                  id="draft-skills-implications"
                  value={draftSkillsImplications}
                  onChange={(e) => setDraftSkillsImplications(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                />
              </div>

              {/* Market drivers */}
              <div className="p-5 space-y-1.5">
                <label htmlFor="draft-market-drivers" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                  Market drivers
                </label>
                <textarea
                  id="draft-market-drivers"
                  value={draftMarketDrivers}
                  onChange={(e) => setDraftMarketDrivers(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-[#2C2C2C] leading-relaxed border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 resize-y"
                />
              </div>

              {/* Government programs (read-only from AI) */}
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

              {/* Timeline (read-only from AI) */}
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
                      (isCreatingNewOt && !newOtName.trim()) ||
                      draftLgaIds.length === 0
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
            <div className="bg-[#FAF9F7] border border-dashed border-[#E8E6E3] p-8 flex items-center justify-center min-h-[300px]" />
          )}
        </div>
      </div>
    </div>
  );
}
