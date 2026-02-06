"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  getDealWithLocalOverrides,
  hasLocalDealOverrides,
  saveDealLocally,
  appendConstraintEvent,
} from "@/lib/deal-storage";
import {
  READINESS_LABELS,
  STAGE_LABELS,
  CONSTRAINT_LABELS,
  ARTEFACT_STATUS_LABELS,
} from "@/lib/labels";
import { STAGE_COLOUR_CLASSES, ARTEFACT_STATUS_COLOUR_CLASSES } from "@/lib/stage-colours";
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
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DealDrawer({
  deal: initialDeal,
  opportunityTypes,
  lgas,
  onClose,
}: DealDrawerProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLocal, setIsLocal] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!initialDeal) {
      setDeal(null);
      setIsLocal(false);
      return;
    }
    const merged = getDealWithLocalOverrides(initialDeal.id, initialDeal);
    setDeal(merged);
    setIsLocal(hasLocalDealOverrides(initialDeal.id));
  }, [initialDeal]);

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

  const handleReadinessChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!deal) return;
      const value = e.target.value as ReadinessState;
      const updated: Deal = {
        ...deal,
        readinessState: value,
        updatedAt: new Date().toISOString(),
      };
      setDeal(updated);
      saveDealLocally(updated);
      setIsLocal(true);
    },
    [deal]
  );

  const handleConstraintChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!deal) return;
      const value = e.target.value as Constraint;
      const updated: Deal = {
        ...deal,
        dominantConstraint: value,
        updatedAt: new Date().toISOString(),
      };
      setDeal(updated);
      saveDealLocally(updated);
      appendConstraintEvent({
        entityType: "deal",
        entityId: deal.id,
        dominantConstraint: value,
        changedAt: updated.updatedAt,
        changeReason: "Edited in UI",
      });
      setIsLocal(true);
    },
    [deal]
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
      const updated: Deal = {
        ...deal,
        gateChecklist: { ...deal.gateChecklist, [stage]: updatedEntries },
        updatedAt: new Date().toISOString(),
      };
      setDeal(updated);
      saveDealLocally(updated);
      setIsLocal(true);
    },
    [deal],
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
      const updated: Deal = {
        ...deal,
        artefacts: { ...deal.artefacts, [stage]: updatedEntries },
        updatedAt: new Date().toISOString(),
      };
      setDeal(updated);
      saveDealLocally(updated);
      setIsLocal(true);
    },
    [deal],
  );

  const handleArtefactFieldChange = useCallback(
    (artefactIndex: number, field: "summary" | "url", value: string) => {
      if (!deal) return;
      const stage = deal.stage;
      const entries = getStageArtefacts(deal.artefacts ?? {}, stage);
      const updatedEntries = entries.map((e, i) =>
        i === artefactIndex ? { ...e, [field]: value || undefined } : e,
      );
      const updated: Deal = {
        ...deal,
        artefacts: { ...deal.artefacts, [stage]: updatedEntries },
        updatedAt: new Date().toISOString(),
      };
      setDeal(updated);
      saveDealLocally(updated);
      setIsLocal(true);
    },
    [deal],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!deal) return null;

  const opportunityTypeName =
    opportunityTypes.find((o) => o.id === deal.opportunityTypeId)?.name ??
    deal.opportunityTypeId;
  const lgaNames = deal.lgaIds
    .map((id) => lgas.find((l) => l.id === id)?.name ?? id)
    .join(", ");

  const gateEntries = getStageGateChecklist(deal.gateChecklist ?? {}, deal.stage);
  const gateSatisfied = gateEntries.filter((e) => e.status === "satisfied").length;
  const gateTotal = gateEntries.length;
  const allGatesSatisfied = gateSatisfied === gateTotal && gateTotal > 0;

  const artefactEntries = getStageArtefacts(deal.artefacts ?? {}, deal.stage);

  const pathwayStage = PATHWAY_STAGES.find((s) => s.id === deal.stage);

  return (
    <aside
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Deal details"
      className="border border-[#E8E6E3] bg-[#FFFFFF] flex flex-col"
    >
      <div className="flex items-center justify-between gap-2 p-4 border-b border-[#E8E6E3]">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]">
          Deal
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close deal drawer"
          className="h-9 px-2 border border-[#E8E6E3] bg-transparent text-[#2C2C2C] text-sm hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLocal && (
          <p
            className="text-xs text-[#7A6B5A] py-2 px-3 border border-[#E8E6E3] bg-[#F5F3F0] mb-4"
            role="status"
            aria-live="polite"
          >
            Updated locally
          </p>
        )}

        {/* Identity group */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Deal name
            </p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">{deal.name}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Opportunity type
            </p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">
              {opportunityTypeName}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              LGAs involved
            </p>
            <p className="text-sm text-[#2C2C2C] leading-relaxed">
              {lgaNames || "—"}
            </p>
          </div>
        </div>

        {/* Classification group */}
        <div className="border-t border-[#E8E6E3] pt-4 mt-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Stage
            </p>
            <span className={`inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${STAGE_COLOUR_CLASSES[deal.stage]}`}>
              {STAGE_LABELS[deal.stage]}
            </span>
          </div>

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
              aria-label="Readiness state"
              className="w-full h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
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
              aria-label="Dominant constraint"
              className="w-full h-9 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
            >
              {CONSTRAINT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {CONSTRAINT_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gate Checklist group */}
        <div className="border-t border-[#E8E6E3] pt-4 mt-4">
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
        </div>

        {/* Artefacts & Documents group */}
        <div className="border-t border-[#E8E6E3] pt-4 mt-4">
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
                  <button
                    type="button"
                    onClick={() => handleArtefactStatusCycle(idx)}
                    aria-label={`${entry.name} status: ${ARTEFACT_STATUS_LABELS[entry.status]}. Click to change.`}
                    className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 cursor-pointer transition duration-300 ease-out hover:opacity-80 ${ARTEFACT_STATUS_COLOUR_CLASSES[entry.status]}`}
                    data-testid={`artefact-status-${idx}`}
                  >
                    {ARTEFACT_STATUS_LABELS[entry.status]}
                  </button>
                </div>

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
                    onChange={(e) => handleArtefactFieldChange(idx, "summary", e.target.value)}
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
                    onChange={(e) => handleArtefactFieldChange(idx, "url", e.target.value)}
                    placeholder="https://..."
                    className="w-full h-8 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-xs placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
                    data-testid={`artefact-url-${idx}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions group */}
        <div className="border-t border-[#E8E6E3] pt-4 mt-4">
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
            What would move this forward
          </p>
          <p className="text-sm text-[#2C2C2C] leading-relaxed">{deal.nextStep}</p>
        </div>

        {/* Reference group */}
        <div className="border-t border-[#E8E6E3] pt-4 mt-4 space-y-3">
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
                    {e.label ?? e.pageRef ?? "—"}
                    {e.pageRef && e.label ? ` (${e.pageRef})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Notes
            </p>
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
            <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
              Last updated
            </p>
            <p className="text-xs text-[#9A9A9A] leading-relaxed">
              {formatDate(deal.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
