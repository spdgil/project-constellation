"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  Deal,
  LGA,
  OpportunityType,
  ReadinessState,
  Constraint,
  GateStatus,
  ArtefactStatus,
  DealGateEntry,
  DealArtefact,
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

export interface DealDrawerProps {
  deal: Deal | null;
  opportunityTypes: OpportunityType[];
  lgas: LGA[];
  onClose: () => void;
  /** Controlled editing state. When provided the parent owns the value. */
  editing?: boolean;
  /** Called when the user toggles editing (via button or Escape). */
  onEditingChange?: (editing: boolean) => void;
  /** When true the drawer uses a wider two-column layout for the content body. */
  expanded?: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DealDrawer({
  deal: initialDeal,
  opportunityTypes,
  lgas,
  onClose,
  editing: editingProp,
  onEditingChange,
  expanded = false,
}: DealDrawerProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [internalEditing, setInternalEditing] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);

  const isControlled = editingProp !== undefined;
  const isEditing = isControlled ? editingProp : internalEditing;

  /* ---------- Deal loading ---------- */

  useEffect(() => {
    if (!initialDeal) {
      setDeal(null);
      setInternalEditing(false);
      return;
    }
    // Deal now comes from the database via server component — no localStorage merge needed
    setDeal(initialDeal);
    setInternalEditing(false);
  }, [initialDeal]);

  /* ---------- Focus management ---------- */

  useEffect(() => {
    if (!deal || !drawerRef.current) return;
    const first = drawerRef.current.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [deal]);

  useEffect(() => {
    if (!deal || !drawerRef.current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = drawerRef.current;
      if (!root || !root.contains(document.activeElement)) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const i = focusable.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (i <= 0) {
          e.preventDefault();
          focusable[focusable.length - 1].focus();
        }
      } else {
        if (i === -1 || i >= focusable.length - 1) {
          e.preventDefault();
          focusable[0].focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [deal]);

  /* ---------- Editing toggle ---------- */

  const toggleEditing = useCallback(() => {
    const next = !isEditing;
    setInternalEditing(next);
    onEditingChange?.(next);
  }, [isEditing, onEditingChange]);

  /* ---------- API save helper ---------- */

  const saveDealField = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!deal) return;
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
        console.error("Failed to save deal:", error);
      }
    },
    [deal],
  );

  /* ---------- Field handlers ---------- */

  const handleReadinessChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!deal) return;
      const value = e.target.value as ReadinessState;
      setDeal({ ...deal, readinessState: value, updatedAt: new Date().toISOString() });
      saveDealField({ readinessState: value });
    },
    [deal, saveDealField],
  );

  const handleConstraintChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!deal) return;
      const value = e.target.value as Constraint;
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
      setDeal({ ...deal, artefacts: newArtefacts, updatedAt: new Date().toISOString() });
      saveDealField({ artefacts: newArtefacts });
    },
    [deal, saveDealField],
  );

  /* ---------- Escape: de-escalate editing → view → close ---------- */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setInternalEditing(false);
          onEditingChange?.(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isEditing, onEditingChange]);

  if (!deal) return null;

  /* ---------- Derived data ---------- */

  const opportunityTypeName =
    opportunityTypes.find((o) => o.id === deal.opportunityTypeId)?.name ?? deal.opportunityTypeId;
  const lgaNames = deal.lgaIds.map((id) => lgas.find((l) => l.id === id)?.name ?? id).join(", ");

  const gateEntries = getStageGateChecklist(deal.gateChecklist ?? {}, deal.stage);
  const gateSatisfied = gateEntries.filter((e) => e.status === "satisfied").length;
  const gateTotal = gateEntries.length;
  const allGatesSatisfied = gateSatisfied === gateTotal && gateTotal > 0;

  const artefactEntries = getStageArtefacts(deal.artefacts ?? {}, deal.stage);
  const pathwayStage = PATHWAY_STAGES.find((s) => s.id === deal.stage);

  /* ---------- Section fragments ---------- */

  const identitySection = (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">Deal name</p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">{deal.name}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">Opportunity type</p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">{opportunityTypeName}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">LGAs involved</p>
        <p className="text-sm text-[#2C2C2C] leading-relaxed">{lgaNames || "\u2014"}</p>
      </div>
    </div>
  );

  const classificationSection = (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">Stage</p>
        <span
          className={`inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[deal.stage]}`}
        >
          {STAGE_LABELS[deal.stage]}
        </span>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">Readiness state</p>
        {isEditing ? (
          <select
            id="deal-readiness"
            value={deal.readinessState}
            onChange={handleReadinessChange}
            aria-label="Readiness state"
            className="w-full h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          >
            {READINESS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {READINESS_LABELS[v]}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${READINESS_COLOUR_CLASSES[deal.readinessState]}`}
          >
            {READINESS_LABELS[deal.readinessState]}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Dominant constraint
        </p>
        {isEditing ? (
          <select
            id="deal-constraint"
            value={deal.dominantConstraint}
            onChange={handleConstraintChange}
            aria-label="Dominant constraint"
            className="w-full h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
          >
            {CONSTRAINT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {CONSTRAINT_LABELS[v]}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-[#2C2C2C] leading-relaxed">
            {CONSTRAINT_LABELS[deal.dominantConstraint]}
          </p>
        )}
      </div>
    </div>
  );

  const gateSection = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
          Stage gate checklist
        </p>
        <span
          className={`text-[10px] tracking-wider px-1.5 py-0.5 ${
            allGatesSatisfied
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]"
          }`}
        >
          {gateSatisfied} of {gateTotal} satisfied
        </span>
      </div>
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
    </div>
  );

  const artefactsSection = (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-2">
        Artefacts &amp; documents
      </p>
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
                    data-testid={`artefact-summary-${idx}`}
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
                    data-testid={`artefact-url-${idx}`}
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
    </div>
  );

  const actionsSection = (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
        What would move this forward
      </p>
      <p className="text-sm text-[#2C2C2C] leading-relaxed">{deal.nextStep}</p>
    </div>
  );

  const referenceSection = (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
          Evidence references
        </p>
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
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">Notes</p>
        {deal.notes.length === 0 ? (
          <p className="text-xs text-[#9A9A9A] leading-relaxed">None</p>
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
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">Last updated</p>
        <p className="text-xs text-[#9A9A9A] leading-relaxed">{formatDate(deal.updatedAt)}</p>
      </div>
    </div>
  );

  const dividerClass = "border-t border-[#E8E6E3] pt-4 mt-4";

  /* ---------- Render ---------- */

  return (
    <aside
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Deal details"
      className="border border-[#E8E6E3] bg-[#FFFFFF] flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-[#E8E6E3] shrink-0">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]">
          Deal
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleEditing}
            aria-label={isEditing ? "Switch to view mode" : "Switch to edit mode"}
            data-testid="mode-toggle"
            className={`h-9 px-3 text-sm border transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] ${
              isEditing
                ? "border-[#2C2C2C] bg-[#2C2C2C] text-white hover:bg-[#444]"
                : "border-[#E8E6E3] bg-transparent text-[#2C2C2C] hover:border-[#9A9A9A]"
            }`}
          >
            {isEditing ? "Editing" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close deal drawer"
            className="h-9 px-2 border border-[#E8E6E3] bg-transparent text-[#2C2C2C] text-sm hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            Close
          </button>
        </div>
      </div>

      {/* Content body */}
      <div className={`flex-1 overflow-auto ${expanded ? "p-6" : "p-4"}`}>
        {expanded ? (
          <div className="grid grid-cols-2 gap-8">
            <div>
              {identitySection}
              <div className={dividerClass}>{classificationSection}</div>
              <div className={dividerClass}>{actionsSection}</div>
              <div className={dividerClass}>{referenceSection}</div>
            </div>
            <div>
              {gateSection}
              <div className={dividerClass}>{artefactsSection}</div>
            </div>
          </div>
        ) : (
          <>
            {identitySection}
            <div className={dividerClass}>{classificationSection}</div>
            <div className={dividerClass}>{gateSection}</div>
            <div className={dividerClass}>{artefactsSection}</div>
            <div className={dividerClass}>{actionsSection}</div>
            <div className={dividerClass}>{referenceSection}</div>
          </>
        )}
      </div>

      {/* Full detail link */}
      <div className="shrink-0 p-4 border-t border-[#E8E6E3]">
        <Link
          href={`/deals/${deal.id}`}
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
          data-testid="view-full-detail"
        >
          View full detail &rarr;
        </Link>
      </div>
    </aside>
  );
}
