/**
 * Typed loaders for static JSON in /data — PRD §7.2
 * No server DB; reads from repo data files.
 */

import type {
  LGA,
  OpportunityType,
  Deal,
  Cluster,
  GeoJSONFeatureCollection,
} from "./types";

// JSON is imported at build time; types asserted in loaders.

/** Load LGAs from data/lgas.json */
export async function loadLgas(): Promise<LGA[]> {
  const data = await import("@/data/lgas.json");
  return data.default as LGA[];
}

/** Load opportunity types from data/opportunityTypes.json */
export async function loadOpportunityTypes(): Promise<OpportunityType[]> {
  const data = await import("@/data/opportunityTypes.json");
  return data.default as OpportunityType[];
}

/** Load deals from data/deals.json */
export async function loadDeals(): Promise<Deal[]> {
  const data = await import("@/data/deals.json");
  return data.default as Deal[];
}

/** Load clusters from data/clusters.json */
export async function loadClusters(): Promise<Cluster[]> {
  const data = await import("@/data/clusters.json");
  return data.default as Cluster[];
}

/** Load QLD LGA boundaries from data/qld-lga-boundaries.json (replace with .geojson when using real boundaries; add Turbopack/webpack rule then) */
export async function loadQldLgaBoundaries(): Promise<GeoJSONFeatureCollection> {
  const data = await import("@/data/qld-lga-boundaries.json");
  return data.default as GeoJSONFeatureCollection;
}
