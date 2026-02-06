/**
 * Lightweight GeoJSON helpers for LGA boundary rendering.
 * No heavy GIS libs; linear projection from geographic bbox to view coords.
 */

import type { GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry } from "./types";

export interface Bounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** Compute geographic bounds of a FeatureCollection. */
export function getBounds(fc: GeoJSONFeatureCollection): Bounds {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const f of fc.features) {
    const g = f.geometry;
    if (!g || !g.coordinates) continue;
    walkCoords(g.coordinates, (lng: number, lat: number) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
  }

  if (minLng === Infinity) {
    return { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
  }
  return { minLng, minLat, maxLng, maxLat };
}

function walkCoords(
  coords: GeoJSONGeometry["coordinates"],
  fn: (lng: number, lat: number) => void
): void {
  if (typeof coords[0] === "number") {
    fn((coords as number[])[0], (coords as number[])[1]);
    return;
  }
  for (const c of coords as number[][]) {
    walkCoords(c, fn);
  }
}

/** Project (lng, lat) to (x, y) in view space; y flipped so north is up. */
export function createProjector(
  bounds: Bounds,
  width: number,
  height: number
): (lng: number, lat: number) => { x: number; y: number } {
  const { minLng, minLat, maxLng, maxLat } = bounds;
  const rangeLng = maxLng - minLng || 1;
  const rangeLat = maxLat - minLat || 1;
  return (lng: number, lat: number) => ({
    x: ((lng - minLng) / rangeLng) * width,
    y: (1 - (lat - minLat) / rangeLat) * height,
  });
}

/** Convert GeoJSON geometry to SVG path d string. */
export function geometryToPathD(
  coordinates: GeoJSONGeometry["coordinates"],
  project: (lng: number, lat: number) => { x: number; y: number }
): string {
  const parts: string[] = [];
  walkRings(coordinates, project, (points) => {
    if (points.length < 2) return;
    parts.push(`M ${points[0].x} ${points[0].y}`);
    for (let i = 1; i < points.length; i++) {
      parts.push(`L ${points[i].x} ${points[i].y}`);
    }
    parts.push("Z");
  });
  return parts.join(" ");
}

function walkRings(
  coords: GeoJSONGeometry["coordinates"],
  project: (lng: number, lat: number) => { x: number; y: number },
  fn: (points: { x: number; y: number }[]) => void
): void {
  if (typeof coords[0] === "number") {
    const lng = (coords as number[])[0];
    const lat = (coords as number[])[1];
    fn([project(lng, lat)]);
    return;
  }
  const first = coords[0];
  if (typeof first[0] === "number") {
    const points = (coords as number[][]).map((c) => project(c[0], c[1]));
    fn(points);
    return;
  }
  if (typeof first[0][0] === "number") {
    for (const ring of coords as number[][][]) {
      const points = ring.map((c) => project(c[0], c[1]));
      fn(points);
    }
    return;
  }
  for (const polygon of coords as number[][][][]) {
    for (const ring of polygon) {
      const points = ring.map((c) => project(c[0], c[1]));
      fn(points);
    }
  }
}

/** Centroid of first ring of a feature (for default marker position). */
export function getFeatureCentroid(
  feature: GeoJSONFeature,
  project: (lng: number, lat: number) => { x: number; y: number }
): { x: number; y: number } | null {
  const g = feature.geometry;
  if (!g || !g.coordinates) return null;
  const ring = firstRing(g.coordinates);
  if (!ring || ring.length === 0) return null;
  let sumX = 0;
  let sumY = 0;
  for (const [lng, lat] of ring) {
    const p = project(lng, lat);
    sumX += p.x;
    sumY += p.y;
  }
  return { x: sumX / ring.length, y: sumY / ring.length };
}

function firstRing(
  coords: GeoJSONGeometry["coordinates"],
): number[][] | null {
  if (typeof coords[0] === "number") return null;
  const first = coords[0];
  if (typeof first[0] === "number") return coords as number[][];
  if (typeof first[0][0] === "number") return (coords as number[][][])[0] ?? null;
  const poly = (coords as number[][][][])[0];
  return poly?.[0] ?? null;
}

export interface LgaPathFeature {
  id: string;
  name: string;
  pathD: string;
}

/** Build SVG path features from a FeatureCollection and projector. */
export function featuresToPathData(
  fc: GeoJSONFeatureCollection,
  project: (lng: number, lat: number) => { x: number; y: number }
): LgaPathFeature[] {
  return fc.features
    .filter((f) => f.geometry && f.geometry.coordinates)
    .map((f) => {
      const id =
        (f.properties?.id as string) ??
        (typeof f.id === "string" ? f.id : String(f.id ?? ""));
      const name = (f.properties?.name as string) ?? id;
      const pathD = geometryToPathD(f.geometry.coordinates, project);
      return { id, name, pathD };
    });
}
