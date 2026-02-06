"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Deal, LGA, OpportunityType, ReadinessState, Constraint } from "@/lib/types";
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
} from "@/lib/labels";

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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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

  return (
    <aside
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Deal details"
      className="w-80 border-l border-[#E8E6E3] bg-[#FFFFFF] flex flex-col shrink-0"
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

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {isLocal && (
          <p
            className="text-xs text-[#7A6B5A] py-2 px-3 border border-[#E8E6E3] bg-[#F5F3F0]"
            role="status"
            aria-live="polite"
          >
            Updated locally
          </p>
        )}

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

        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
            Stage
          </p>
          <p className="text-sm text-[#2C2C2C] leading-relaxed">
            {STAGE_LABELS[deal.stage]}
          </p>
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

        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
            What would move this forward
          </p>
          <p className="text-sm text-[#2C2C2C] leading-relaxed">{deal.nextStep}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">
            Evidence references
          </p>
          {deal.evidence.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">None</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-1">
              {deal.evidence.map((e, i) => (
                <li key={i} className="text-sm text-[#2C2C2C] leading-relaxed">
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
            <p className="text-sm text-[#6B6B6B] leading-relaxed">None</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-2">
              {deal.notes.map((n) => (
                <li key={n.id} className="text-sm text-[#2C2C2C] leading-relaxed">
                  <span className="text-xs text-[#9A9A9A] block">
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
          <p className="text-sm text-[#2C2C2C] leading-relaxed">
            {formatDate(deal.updatedAt)}
          </p>
        </div>
      </div>
    </aside>
  );
}
