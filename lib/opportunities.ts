/**
 * Aggregations and replication signals for opportunity types — PRD §6.5, §6.7
 * Computed from deals (with localStorage overrides applied upstream).
 */

import type { Deal, OpportunityType, LGA, ReadinessState, Constraint } from "./types";
import { READINESS_LABELS, CONSTRAINT_LABELS } from "./labels";

export interface ReadinessCount {
  readinessState: ReadinessState;
  label: string;
  count: number;
}

export interface ConstraintCount {
  constraint: Constraint;
  label: string;
  count: number;
}

/** Count deals by readiness state for a given list. */
export function countByReadiness(deals: Deal[]): ReadinessCount[] {
  const map = new Map<ReadinessState, number>();
  for (const d of deals) {
    map.set(d.readinessState, (map.get(d.readinessState) ?? 0) + 1);
  }
  const order: ReadinessState[] = [
    "no-viable-projects",
    "conceptual-interest",
    "feasibility-underway",
    "structurable-but-stalled",
    "investable-with-minor-intervention",
    "scaled-and-replicable",
  ];
  return order
    .filter((r) => (map.get(r) ?? 0) > 0)
    .map((readinessState) => ({
      readinessState,
      label: READINESS_LABELS[readinessState],
      count: map.get(readinessState) ?? 0,
    }));
}

/** Count deals by dominant constraint for a given list. */
export function countByConstraint(deals: Deal[]): ConstraintCount[] {
  const map = new Map<Constraint, number>();
  for (const d of deals) {
    map.set(d.dominantConstraint, (map.get(d.dominantConstraint) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([constraint, count]) => ({
      constraint,
      label: CONSTRAINT_LABELS[constraint],
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Top 1–2 constraints by count (for index summary). */
export function topConstraints(deals: Deal[], n: number = 2): ConstraintCount[] {
  return countByConstraint(deals).slice(0, n);
}

/** Replication: constraints that appear in 2+ distinct LGAs (for this deal set). */
export function constraintsAcrossLgas(
  deals: Deal[]
): { constraint: Constraint; label: string; lgaCount: number }[] {
  const constraintToLgas = new Map<Constraint, Set<string>>();
  for (const d of deals) {
    const set = constraintToLgas.get(d.dominantConstraint) ?? new Set<string>();
    for (const lgaId of d.lgaIds) set.add(lgaId);
    constraintToLgas.set(d.dominantConstraint, set);
  }
  return Array.from(constraintToLgas.entries())
    .filter(([, lgaIds]) => lgaIds.size >= 2)
    .map(([constraint, lgaIds]) => ({
      constraint,
      label: CONSTRAINT_LABELS[constraint],
      lgaCount: lgaIds.size,
    }))
    .sort((a, b) => b.lgaCount - a.lgaCount);
}

/** Replication: readiness states where 2+ deals are stalled (same state). */
export function stallPoints(deals: Deal[]): ReadinessCount[] {
  return countByReadiness(deals).filter((r) => r.count >= 2);
}

/** Resolve LGA names for a deal. */
export function dealLgaNames(deal: Deal, lgas: LGA[]): string[] {
  return deal.lgaIds.map(
    (id) => lgas.find((l) => l.id === id)?.name ?? id
  );
}

/** Constraint summary by LGA: for each LGA, top constraints (deals in that LGA). */
export function constraintSummaryByLga(
  deals: Deal[],
  lgas: LGA[],
  topN: number = 3
): { lgaId: string; lgaName: string; constraints: ConstraintCount[] }[] {
  return lgas.map((lga) => {
    const lgaDeals = deals.filter((d) => d.lgaIds.includes(lga.id));
    const constraints = countByConstraint(lgaDeals).slice(0, topN);
    return {
      lgaId: lga.id,
      lgaName: lga.name,
      constraints,
    };
  });
}
