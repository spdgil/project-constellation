"use client";

/**
 * Shared hook for deal editing operations.
 * Extracts common logic from DealDetail and DealDrawer.
 */

import { useCallback } from "react";
import { logClientError } from "@/lib/client-logger";
import type {
  Deal,
  DealStage,
  GateStatus,
  ArtefactStatus,
  ReadinessState,
  Constraint,
} from "@/lib/types";
import {
  getStageGateChecklist,
  getStageArtefacts,
} from "@/lib/deal-pathway-utils";

// Re-export option arrays so components don't need to define them locally
export const READINESS_OPTIONS: ReadinessState[] = [
  "no-viable-projects",
  "conceptual-interest",
  "feasibility-underway",
  "structurable-but-stalled",
  "investable-with-minor-intervention",
  "scaled-and-replicable",
];

export const CONSTRAINT_OPTIONS: Constraint[] = [
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

const ARTEFACT_STATUS_CYCLE: ArtefactStatus[] = [
  "not-started",
  "in-progress",
  "complete",
];

interface UseDealEditorOptions {
  dealId: string;
  deal: Deal;
  setDeal: React.Dispatch<React.SetStateAction<Deal>>;
}

export function useDealEditor({ dealId, setDeal }: UseDealEditorOptions) {
  /** PATCH a single field on the deal API. */
  const saveDealField = useCallback(
    async (field: string, value: unknown) => {
      try {
        const res = await fetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) {
          logClientError(`Failed to save ${field}`, { status: res.status });
        }
      } catch (error) {
        logClientError(`Failed to save ${field}`, { error: String(error) });
      }
    },
    [dealId],
  );

  /** Toggle a gate checklist entry. */
  const toggleGate = useCallback(
    (stage: DealStage, idx: number) => {
      setDeal((prev) => {
        const gates = [...getStageGateChecklist(prev.gateChecklist ?? {}, stage)];
        const current = gates[idx];
        if (!current) return prev;
        const newStatus: GateStatus =
          current.status === "satisfied" ? "pending" : "satisfied";
        gates[idx] = { ...current, status: newStatus };
        const newChecklist = { ...prev.gateChecklist, [stage]: gates };
        saveDealField("gateChecklist", newChecklist);
        return { ...prev, gateChecklist: newChecklist };
      });
    },
    [setDeal, saveDealField],
  );

  /** Cycle artefact status: not-started → in-progress → complete. */
  const cycleArtefactStatus = useCallback(
    (stage: DealStage, idx: number) => {
      setDeal((prev) => {
        const items = [...getStageArtefacts(prev.artefacts ?? {}, stage)];
        const current = items[idx];
        if (!current) return prev;
        const currentIdx = ARTEFACT_STATUS_CYCLE.indexOf(current.status);
        const nextStatus =
          ARTEFACT_STATUS_CYCLE[(currentIdx + 1) % ARTEFACT_STATUS_CYCLE.length];
        items[idx] = { ...current, status: nextStatus };
        const newArtefacts = { ...prev.artefacts, [stage]: items };
        saveDealField("artefacts", newArtefacts);
        return { ...prev, artefacts: newArtefacts };
      });
    },
    [setDeal, saveDealField],
  );

  /** Update an artefact text field (summary or url). */
  const updateArtefactField = useCallback(
    (stage: DealStage, idx: number, field: "summary" | "url", value: string) => {
      setDeal((prev) => {
        const items = [...getStageArtefacts(prev.artefacts ?? {}, stage)];
        const current = items[idx];
        if (!current) return prev;
        items[idx] = { ...current, [field]: value };
        const newArtefacts = { ...prev.artefacts, [stage]: items };
        saveDealField("artefacts", newArtefacts);
        return { ...prev, artefacts: newArtefacts };
      });
    },
    [setDeal, saveDealField],
  );

  return {
    saveDealField,
    toggleGate,
    cycleArtefactStatus,
    updateArtefactField,
  };
}
