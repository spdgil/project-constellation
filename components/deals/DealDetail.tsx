"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Deal,
  DealDocument,
  LGA,
  OpportunityType,
  SectorOpportunity,
  ReadinessState,
  Constraint,
  GateStatus,
  ArtefactStatus,
} from "@/lib/types";
// deal-storage is no longer needed — all mutations go through API routes
import {
  READINESS_LABELS,
  STAGE_LABELS,
  CONSTRAINT_LABELS,
  ARTEFACT_STATUS_LABELS,
} from "@/lib/labels";
import {
  STAGE_COLOUR_CLASSES,
  READINESS_COLOUR_CLASSES,
  ARTEFACT_STATUS_COLOUR_CLASSES,
} from "@/lib/stage-colours";
import { getStageGateChecklist, getStageArtefacts } from "@/lib/deal-pathway-utils";
import { PATHWAY_STAGES } from "@/lib/pathway-data";
import { formatDate } from "@/lib/format";
import { logClientError } from "@/lib/client-logger";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { DealHero } from "./DealHero";
import { DealSidebar } from "./DealSidebar";
import { DealPathwayStepper } from "./DealPathwayStepper";

const ARTEFACT_STATUS_CYCLE: ArtefactStatus[] = ["not-started", "in-progress", "complete"];

const READINESS_OPTIONS: ReadinessState[] = [
  "no-viable-projects",
  "conceptual-interest",
  "feasibility-underway",
  "structurable-but-stalled",
  "investable-with-minor-intervention",
  "scaled-and-replicable",
];

const CONSTRAINT_OPTIONS: Constraint[] = [
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

export interface DealDetailProps {
  /** Static deal from JSON data, or null for locally-created deals. */
  deal: Deal | null;
  /** The deal ID (always provided so we can resolve from localStorage). */
  dealId: string;
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
  allDeals: Deal[];
  sectorOpportunities: SectorOpportunity[];
}

/**
 * Full-page deal detail view.
 * Hero summary, accordion sections, and contextual sidebar.
 * Supports view and edit modes.
 *
 * Resolves deal from localStorage if not found in static JSON data
 * (e.g. AI-created deals via the "New Deal" tab).
 */
export function DealDetail({
  deal: initialDeal,
  dealId,
  opportunityTypes,
  lgas,
  allDeals,
  sectorOpportunities,
}: DealDetailProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(initialDeal);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ---------- Editing toggle ---------- */

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  /* ---------- Delete handler ---------- */

  const handleDelete = useCallback(async () => {
    try {
      await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
      router.push("/deals/list");
    } catch (error) {
      logClientError("Failed to delete deal", { error: String(error) }, "DealDetail");
    }
  }, [dealId, router]);

  /* ---------- Document handlers ---------- */

  const docInputRef = useRef<HTMLInputElement>(null);

  const handleAddDocument = useCallback(
    async (files: FileList | null) => {
      if (!deal || !files || files.length === 0) return;
      const newDocs: DealDocument[] = [...(deal.documents ?? [])];
      for (const f of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", f);
        try {
          const res = await fetch(`/api/deals/${deal.id}/documents`, {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const doc = (await res.json()) as {
              id: string;
              fileName: string;
              mimeType: string;
              sizeBytes: number;
              label: string | null;
              addedAt: string;
            };
            newDocs.push({
              id: doc.id,
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              sizeBytes: doc.sizeBytes,
              fileUrl: "", // Files stored in Vercel Blob, URL populated on fetch
              addedAt: doc.addedAt,
              label: doc.label ?? undefined,
            });
          }
        } catch (error) {
          logClientError(
            "Failed to upload document",
            { error: String(error) },
            "DealDetail",
          );
        }
      }
      setDeal({ ...deal, documents: newDocs, updatedAt: new Date().toISOString() });
    },
    [deal],
  );

  const handleRemoveDocument = useCallback(
    async (docId: string) => {
      if (!deal) return;
      try {
        await fetch(`/api/deals/${deal.id}/documents/${docId}`, {
          method: "DELETE",
        });
        const newDocs = (deal.documents ?? []).filter((d) => d.id !== docId);
        setDeal({ ...deal, documents: newDocs, updatedAt: new Date().toISOString() });
      } catch (error) {
        logClientError(
          "Failed to remove document",
          { error: String(error) },
          "DealDetail",
        );
      }
    },
    [deal],
  );

  const handleDownloadDocument = useCallback(
    (doc: DealDocument) => {
      if (!deal) return;
      // Download from API
      const a = document.createElement("a");
      a.href = `/api/deals/${deal.id}/documents/${doc.id}`;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [deal],
  );

  const formatDocSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ---------- API save helper ---------- */

  const saveDealField = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!deal) return;
      setIsSaving(true);
      try {
        const res = await fetch(`/api/deals/${deal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const updated = (await res.json()) as Deal;
          setDeal(updated);
        }
      } catch (error) {
        logClientError("Failed to save deal", { error: String(error) }, "DealDetail");
      } finally {
        setIsSaving(false);
      }
    },
    [deal],
  );

  /* ---------- Field handlers ---------- */

  const handleReadinessChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!deal) return;
      const value = e.target.value as ReadinessState;
      // Optimistic update
      setDeal({ ...deal, readinessState: value, updatedAt: new Date().toISOString() });
      saveDealField({ readinessState: value });
    },
    [deal, saveDealField],
  );

  const handleConstraintChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!deal) return;
      const value = e.target.value as Constraint;
      // Optimistic update
      setDeal({ ...deal, dominantConstraint: value, updatedAt: new Date().toISOString() });
      saveDealField({ dominantConstraint: value, changeReason: "Edited in UI" });
    },
    [deal, saveDealField],
  );

  const handleGateToggle = useCallback(
    (questionIndex: number) => {
      if (!deal) return;
      const stage = deal.stage;
      const entries = getStageGateChecklist(deal.gateChecklist ?? {}, stage);
      const entry = entries[questionIndex];
      if (!entry) return;
      const newStatus: GateStatus = entry.status === "satisfied" ? "pending" : "satisfied";
      const updatedEntries = entries.map((e, i) =>
        i === questionIndex ? { ...e, status: newStatus } : e,
      );
      const newChecklist = { ...deal.gateChecklist, [stage]: updatedEntries };
      // Optimistic update
      setDeal({ ...deal, gateChecklist: newChecklist, updatedAt: new Date().toISOString() });
      saveDealField({ gateChecklist: newChecklist });
    },
    [deal, saveDealField],
  );

  const handleArtefactStatusCycle = useCallback(
    (artefactIndex: number) => {
      if (!deal) return;
      const stage = deal.stage;
      const entries = getStageArtefacts(deal.artefacts ?? {}, stage);
      const entry = entries[artefactIndex];
      if (!entry) return;
      const currentIdx = ARTEFACT_STATUS_CYCLE.indexOf(entry.status);
      const nextStatus = ARTEFACT_STATUS_CYCLE[(currentIdx + 1) % ARTEFACT_STATUS_CYCLE.length];
      const updatedEntries = entries.map((e, i) =>
        i === artefactIndex ? { ...e, status: nextStatus } : e,
      );
      const newArtefacts = { ...deal.artefacts, [stage]: updatedEntries };
      // Optimistic update
      setDeal({ ...deal, artefacts: newArtefacts, updatedAt: new Date().toISOString() });
      saveDealField({ artefacts: newArtefacts });
    },
    [deal, saveDealField],
  );

  const handleArtefactFieldChange = useCallback(
    (artefactIndex: number, field: "summary" | "url", value: string) => {
      if (!deal) return;
      const stage = deal.stage;
      const entries = getStageArtefacts(deal.artefacts ?? {}, stage);
      const updatedEntries = entries.map((e, i) =>
        i === artefactIndex ? { ...e, [field]: value || undefined } : e,
      );
      const newArtefacts = { ...deal.artefacts, [stage]: updatedEntries };
      // Optimistic update
      setDeal({ ...deal, artefacts: newArtefacts, updatedAt: new Date().toISOString() });
      saveDealField({ artefacts: newArtefacts });
    },
    [deal, saveDealField],
  );

  const selectClass =
    "w-full h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out";

  /* ---------- Render ---------- */

  if (!deal) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block h-6 w-6 border-2 border-[#E8E6E3] border-t-[#2C2C2C] rounded-full animate-spin" />
      </div>
    );
  }

  /* ---------- Derived data (deal is guaranteed non-null here) ---------- */

  const gateEntries = getStageGateChecklist(deal.gateChecklist ?? {}, deal.stage);
  const gateSatisfied = gateEntries.filter((e) => e.status === "satisfied").length;
  const gateTotal = gateEntries.length;
  const allGatesSatisfied = gateSatisfied === gateTotal && gateTotal > 0;

  const artefactEntries = getStageArtefacts(deal.artefacts ?? {}, deal.stage);
  const artefactComplete = artefactEntries.filter((e) => e.status === "complete").length;
  const pathwayStage = PATHWAY_STAGES.find((s) => s.id === deal.stage);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/deals/list"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          &larr; Back to deals
        </Link>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {isSaving && (
                <span className="text-xs text-[#7A6B5A] flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 border-[1.5px] border-[#E8E6E3] border-t-[#7A6B5A] rounded-full animate-spin" />
                  Saving
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete deal"
                className="h-9 px-3 text-sm text-[#9A9A9A] hover:text-red-600 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={toggleEditing}
                data-testid="mode-toggle"
                aria-label="Save and exit edit mode"
                className="h-9 px-4 text-sm font-medium bg-[#7A6B5A] text-white hover:bg-[#5A4B3A] border border-[#7A6B5A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
              >
                Done
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleEditing}
              data-testid="mode-toggle"
              aria-label="Switch to edit mode"
              className="h-9 px-4 text-sm border border-[#E8E6E3] bg-transparent text-[#2C2C2C] hover:border-[#7A6B5A] hover:text-[#7A6B5A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className="bg-white border border-[#E8E6E3] shadow-lg max-w-sm w-full mx-4 p-6 space-y-4">
            <h3 className="font-heading text-base font-medium text-[#2C2C2C]">
              Delete deal?
            </h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              This will permanently remove{" "}
              <span className="font-medium text-[#2C2C2C]">{deal.name}</span>{" "}
              from your local deals. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9 px-4 text-sm border border-[#E8E6E3] bg-transparent text-[#2C2C2C] hover:border-[#9A9A9A] transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                data-testid="confirm-delete"
                className="h-9 px-4 text-sm bg-red-600 text-white hover:bg-red-700 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal pathway — shows current stage in context */}
      <DealPathwayStepper activeStageId={deal.stage} />

      {/* Two-column grid: main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (2/3) */}
        <div className="lg:col-span-2 space-y-0">
          {/* Hero card */}
          <DealHero
            deal={deal}
            opportunityTypes={opportunityTypes}
            lgas={lgas}
            isEditing={isEditing}
            onSave={saveDealField}
            onOptimisticUpdate={(patch) =>
              setDeal((prev) =>
                prev ? { ...prev, ...patch, updatedAt: new Date().toISOString() } : prev,
              )
            }
          />

          {/* Edit-mode overrides for classification */}
          {isEditing && (
            <div className="bg-white border border-t-0 border-[#E8E6E3] p-6 space-y-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
                Classification (editable)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="deal-readiness"
                    className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1 block"
                  >
                    Readiness state
                  </label>
                  <select
                    id="deal-readiness"
                    value={deal.readinessState}
                    onChange={handleReadinessChange}
                    className={selectClass}
                  >
                    {READINESS_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {READINESS_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="deal-constraint"
                    className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1 block"
                  >
                    Dominant constraint
                  </label>
                  <select
                    id="deal-constraint"
                    value={deal.dominantConstraint}
                    onChange={handleConstraintChange}
                    className={selectClass}
                  >
                    {CONSTRAINT_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {CONSTRAINT_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Accordion sections */}
          <div className="bg-white border border-t-0 border-[#E8E6E3] px-6 pb-2">
            {/* Gate Checklist */}
            <AccordionSection
              title="Gate checklist"
              badge={`${gateSatisfied}/${gateTotal}`}
              defaultOpen
            >
              {isEditing ? (
                <fieldset className="space-y-2">
                  <legend className="sr-only">
                    Gate checklist for {STAGE_LABELS[deal.stage]} stage
                  </legend>
                  {gateEntries.map((entry, idx) => {
                    const desc = pathwayStage?.gateChecklist.find(
                      (g) => g.question === entry.question,
                    )?.description;
                    return (
                      <label
                        key={entry.question}
                        className="flex items-start gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={entry.status === "satisfied"}
                          onChange={() => handleGateToggle(idx)}
                          aria-label={`${entry.question}: ${entry.status}`}
                          className="mt-0.5 h-4 w-4 accent-emerald-600 cursor-pointer"
                          data-testid={`gate-checkbox-${idx}`}
                        />
                        <span className="flex-1 min-w-0">
                          <span
                            className={`text-sm leading-relaxed block ${
                              entry.status === "satisfied"
                                ? "text-emerald-700 line-through"
                                : "text-[#2C2C2C]"
                            }`}
                          >
                            {entry.question}
                          </span>
                          {desc && (
                            <span className="text-[10px] text-[#9A9A9A] leading-snug block mt-0.5">
                              {desc}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : (
                <ul className="space-y-1.5 list-none p-0 m-0">
                  {gateEntries.map((entry) => (
                    <li key={entry.question} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 mt-0.5 text-sm ${
                          entry.status === "satisfied" ? "text-emerald-600" : "text-[#C8C4BF]"
                        }`}
                        aria-hidden="true"
                      >
                        {entry.status === "satisfied" ? "\u2713" : "\u2015"}
                      </span>
                      <span
                        className={`text-sm leading-relaxed ${
                          entry.status === "satisfied" ? "text-emerald-700" : "text-[#2C2C2C]"
                        }`}
                      >
                        {entry.question}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AccordionSection>

            {/* Artefacts & Documents */}
            <AccordionSection
              title="Artefacts and documents"
              badge={`${artefactComplete}/${artefactEntries.length}`}
            >
              <div className="space-y-3">
                {artefactEntries.map((entry, idx) => (
                  <div
                    key={entry.name}
                    className="border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-[#2C2C2C] leading-relaxed flex-1 min-w-0">
                        {entry.name}
                      </p>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleArtefactStatusCycle(idx)}
                          aria-label={`${entry.name} status: ${ARTEFACT_STATUS_LABELS[entry.status]}. Click to change.`}
                          className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 cursor-pointer transition duration-300 ease-out hover:opacity-80 ${ARTEFACT_STATUS_COLOUR_CLASSES[entry.status]}`}
                          data-testid={`artefact-status-${idx}`}
                        >
                          {ARTEFACT_STATUS_LABELS[entry.status]}
                        </button>
                      ) : (
                        <span
                          className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${ARTEFACT_STATUS_COLOUR_CLASSES[entry.status]}`}
                          data-testid={`artefact-status-${idx}`}
                        >
                          {ARTEFACT_STATUS_LABELS[entry.status]}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <div>
                          <label
                            htmlFor={`artefact-summary-${idx}`}
                            className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1 block"
                          >
                            Summary
                          </label>
                          <textarea
                            id={`artefact-summary-${idx}`}
                            value={entry.summary ?? ""}
                            onChange={(e) =>
                              handleArtefactFieldChange(idx, "summary", e.target.value)
                            }
                            placeholder="Describe the document..."
                            rows={2}
                            className="w-full px-2 py-1.5 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-xs placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out resize-y"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`artefact-url-${idx}`}
                            className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1 block"
                          >
                            Document link
                          </label>
                          <input
                            type="url"
                            id={`artefact-url-${idx}`}
                            value={entry.url ?? ""}
                            onChange={(e) =>
                              handleArtefactFieldChange(idx, "url", e.target.value)
                            }
                            placeholder="https://..."
                            className="w-full h-8 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-xs placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {entry.summary && (
                          <p className="text-xs text-[#2C2C2C] leading-relaxed">{entry.summary}</p>
                        )}
                        {entry.url && (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] break-all"
                          >
                            {entry.url}
                          </a>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Risks & Challenges */}
            {deal.risks && deal.risks.length > 0 && (
              <AccordionSection title="Risks and challenges" badge={`${deal.risks.length}`}>
                <ul className="space-y-2 list-none p-0 m-0">
                  {deal.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5 text-sm text-[#B54A4A]" aria-hidden="true">
                        &bull;
                      </span>
                      <span className="text-sm text-[#2C2C2C] leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Strategic Actions */}
            {deal.strategicActions && deal.strategicActions.length > 0 && (
              <AccordionSection title="Strategic actions">
                <ul className="space-y-2 list-none p-0 m-0">
                  {deal.strategicActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5 text-sm text-[#7A6B5A]" aria-hidden="true">
                        &rarr;
                      </span>
                      <span className="text-sm text-[#2C2C2C] leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Infrastructure & Market Context */}
            {(deal.infrastructureNeeds?.length || deal.marketDrivers || deal.skillsImplications) && (
              <AccordionSection title="Infrastructure and market">
                <div className="space-y-4">
                  {deal.infrastructureNeeds && deal.infrastructureNeeds.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                        Infrastructure needs
                      </p>
                      <ul className="space-y-1 list-none p-0 m-0">
                        {deal.infrastructureNeeds.map((item, i) => (
                          <li key={i} className="text-sm text-[#2C2C2C] leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {deal.skillsImplications && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                        Skills implications
                      </p>
                      <p className="text-sm text-[#2C2C2C] leading-relaxed">
                        {deal.skillsImplications}
                      </p>
                    </div>
                  )}
                  {deal.marketDrivers && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                        Market drivers
                      </p>
                      <p className="text-sm text-[#2C2C2C] leading-relaxed">
                        {deal.marketDrivers}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* Government Programs & Funding */}
            {deal.governmentPrograms && deal.governmentPrograms.length > 0 && (
              <AccordionSection title="Government programs and funding">
                <ul className="space-y-2 list-none p-0 m-0">
                  {deal.governmentPrograms.map((prog, i) => (
                    <li key={i} className="text-sm text-[#2C2C2C] leading-relaxed">
                      <span className="font-medium">{prog.name}</span>
                      {prog.description && (
                        <span className="text-[#6B6B6B]"> &mdash; {prog.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Timeline */}
            {deal.timeline && deal.timeline.length > 0 && (
              <AccordionSection title="Timeline">
                <ul className="space-y-2 list-none p-0 m-0">
                  {deal.timeline.map((milestone, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {milestone.date ? (
                        <span className="shrink-0 text-xs text-[#6B6B6B] w-20">
                          {milestone.date}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-[#9A9A9A] w-20">&mdash;</span>
                      )}
                      <span className="text-sm text-[#2C2C2C] leading-relaxed">
                        {milestone.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Evidence & References */}
            <AccordionSection title="Evidence and references">
              <div className="space-y-3">
                {deal.evidence.length === 0 ? (
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">None</p>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-1">
                    {deal.evidence.map((e, i) => (
                      <li key={i} className="text-xs text-[#2C2C2C] leading-relaxed">
                        {e.label ?? e.pageRef ?? "\u2014"}
                        {e.pageRef && e.label ? ` (${e.pageRef})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AccordionSection>

            {/* Document Directory */}
            <AccordionSection
              title="Document directory"
              badge={
                deal.documents && deal.documents.length > 0
                  ? `${deal.documents.length}`
                  : undefined
              }
            >
              <div className="space-y-3">
                {(!deal.documents || deal.documents.length === 0) ? (
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">
                    No documents attached yet.
                  </p>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-2">
                    {deal.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-start gap-3 p-3 border border-[#E8E6E3] rounded bg-[#FAFAF9]"
                      >
                        {/* File icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-[#7A6B5A]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#2C2C2C] truncate">
                            {doc.label || doc.fileName}
                          </p>
                          <p className="text-[10px] text-[#9A9A9A] mt-0.5">
                            {formatDocSize(doc.sizeBytes)} &middot;{" "}
                            {formatDate(doc.addedAt)}
                          </p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-[10px] text-[#7A6B5A] hover:text-[#2C2C2C] underline underline-offset-2 transition-colors"
                            title="Download"
                          >
                            Download
                          </button>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="text-[10px] text-red-600 hover:text-red-800 underline underline-offset-2 transition-colors"
                              title="Remove"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Upload button */}
                <div>
                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={(e) => {
                      handleAddDocument(e.target.files);
                      if (docInputRef.current) docInputRef.current.value = "";
                    }}
                  />
                  <button
                    onClick={() => docInputRef.current?.click()}
                    className="text-xs font-medium text-[#7A6B5A] hover:text-[#2C2C2C] border border-dashed border-[#D5D2CD] rounded px-3 py-2 w-full text-center transition-colors hover:border-[#7A6B5A]"
                  >
                    + Add document
                  </button>
                </div>
              </div>
            </AccordionSection>

            {/* Notes & Activity */}
            <AccordionSection
              title="Notes and activity"
              badge={deal.notes.length > 0 ? `${deal.notes.length}` : undefined}
            >
              <div className="space-y-3">
                {deal.notes.length === 0 ? (
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">No notes yet</p>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-2">
                    {deal.notes.map((n) => (
                      <li key={n.id} className="text-xs text-[#2C2C2C] leading-relaxed">
                        <span className="text-[10px] text-[#9A9A9A] block">
                          {formatDate(n.createdAt)}
                        </span>
                        {n.content}
                      </li>
                    ))}
                  </ul>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Last updated
                  </p>
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">
                    {formatDate(deal.updatedAt)}
                  </p>
                </div>
              </div>
            </AccordionSection>
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <DealSidebar
              deal={deal}
              opportunityTypes={opportunityTypes}
              lgas={lgas}
              allDeals={allDeals}
              sectorOpportunities={sectorOpportunities}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

