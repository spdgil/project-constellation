/**
 * Centralised colour system for the application.
 *
 * Four monochromatic colour families (amber, blue, violet, emerald) used
 * semantically across all pages:
 *
 * | Colour  | Semantic purpose                                    |
 * |---------|-----------------------------------------------------|
 * | Amber   | Financial / investment / early-stage / resources     |
 * | Blue    | Progress / in-flight / infrastructure / deals        |
 * | Violet  | Structural / distinctive / governance / LGAs         |
 * | Emerald | Positive / advanced / impact / energy                |
 *
 * Badge-level colours for deal stages and readiness states remain in
 * `lib/stage-colours.ts`. This module handles layout-level colour:
 * card borders, stat values, sidebar accents, tag chips.
 */

/* -------------------------------------------------------------------------- */
/* Core type                                                                   */
/* -------------------------------------------------------------------------- */

export type ColourFamily = "amber" | "blue" | "violet" | "emerald";

/* -------------------------------------------------------------------------- */
/* Tailwind class sets per colour family                                        */
/* -------------------------------------------------------------------------- */

export const COLOUR_CLASSES: Record<
  ColourFamily,
  {
    borderTop: string;
    borderLeft: string;
    bg: string;
    text: string;
    tagBg: string;
    tagText: string;
    tagBorder: string;
    dot: string;
  }
> = {
  amber: {
    borderTop: "border-t-amber-400",
    borderLeft: "border-l-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    tagBg: "bg-amber-50",
    tagText: "text-amber-700",
    tagBorder: "border-amber-200",
    dot: "bg-amber-400",
  },
  blue: {
    borderTop: "border-t-blue-400",
    borderLeft: "border-l-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    tagBg: "bg-blue-50",
    tagText: "text-blue-700",
    tagBorder: "border-blue-200",
    dot: "bg-blue-400",
  },
  violet: {
    borderTop: "border-t-violet-400",
    borderLeft: "border-l-violet-400",
    bg: "bg-violet-50",
    text: "text-violet-700",
    tagBg: "bg-violet-50",
    tagText: "text-violet-700",
    tagBorder: "border-violet-200",
    dot: "bg-violet-400",
  },
  emerald: {
    borderTop: "border-t-emerald-400",
    borderLeft: "border-l-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
    tagBorder: "border-emerald-200",
    dot: "bg-emerald-400",
  },
};

/* -------------------------------------------------------------------------- */
/* Sector opportunity → colour family                                          */
/* -------------------------------------------------------------------------- */

export const SECTOR_COLOUR: Record<string, ColourFamily> = {
  sector_opportunity_critical_minerals_value_chain: "amber",
  sector_opportunity_renewable_energy_services: "emerald",
  sector_opportunity_bioenergy_biofuels: "emerald",
  sector_opportunity_biomanufacturing: "blue",
  sector_opportunity_circular_economy_mining_industrial: "violet",
  sector_opportunity_space_industrial_support: "blue",
  sector_opportunity_post_mining_land_use: "amber",
};

/* -------------------------------------------------------------------------- */
/* Opportunity type → colour family (deal-level)                               */
/* -------------------------------------------------------------------------- */

export const OPP_TYPE_COLOUR: Record<string, ColourFamily> = {
  "critical-minerals": "amber",
  "renewable-energy": "emerald",
  bioenergy: "emerald",
  biomanufacturing: "blue",
  "circular-economy": "violet",
  space: "blue",
  "post-mining-land-use": "amber",
};

/* -------------------------------------------------------------------------- */
/* Tag → colour family                                                         */
/* -------------------------------------------------------------------------- */

export const TAG_COLOUR: Record<string, ColourFamily> = {
  energy_transition: "emerald",
  infrastructure: "blue",
  operations_maintenance: "blue",
  construction: "blue",
  manufacturing: "blue",
  advanced_manufacturing: "violet",
  resources: "amber",
  processing: "amber",
  supply_chain: "amber",
  bioeconomy: "emerald",
  industrial_process: "amber",
  fuels: "amber",
  food: "violet",
  bioprocess: "violet",
  circular_economy: "violet",
  industrial_services: "amber",
  materials: "amber",
  maintenance: "blue",
  space: "blue",
  operations: "blue",
  standards: "violet",
  mine_closure: "amber",
  remediation: "amber",
  land_use: "emerald",
  environmental_services: "emerald",
};

/* -------------------------------------------------------------------------- */
/* Opportunity-type ID → sector-opportunity ID mapping                         */
/* -------------------------------------------------------------------------- */

export const OPP_TYPE_TO_SECTOR: Record<string, string> = {
  "critical-minerals": "sector_opportunity_critical_minerals_value_chain",
  "renewable-energy": "sector_opportunity_renewable_energy_services",
  bioenergy: "sector_opportunity_bioenergy_biofuels",
  biomanufacturing: "sector_opportunity_biomanufacturing",
  "circular-economy": "sector_opportunity_circular_economy_mining_industrial",
  space: "sector_opportunity_space_industrial_support",
  "post-mining-land-use": "sector_opportunity_post_mining_land_use",
};

/* -------------------------------------------------------------------------- */
/* Deal stage → colour family (mirrors stage-colours.ts semantics)             */
/* -------------------------------------------------------------------------- */

export const STAGE_TO_COLOUR: Record<string, ColourFamily> = {
  definition: "amber",
  "pre-feasibility": "amber",
  feasibility: "blue",
  structuring: "violet",
  "transaction-close": "emerald",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Format a dollar amount in compact AUD notation. */
export function formatAUD(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1_000_000_000_000) {
    const t = value / 1_000_000_000_000;
    return `$${t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)}T`;
  }
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/** Humanise a snake_case tag into a readable label. */
export function humaniseTag(tag: string): string {
  return tag.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
