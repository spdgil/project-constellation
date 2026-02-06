#!/usr/bin/env node
/**
 * Fetch ALL Queensland LGA land-clipped boundary polygons from the ABS
 * ASGS 2021 ArcGIS REST Service (Layer 1: LGA_GEN — generalised,
 * clipped to coastline).
 *
 * The three Greater Whitsunday LGAs (Mackay, Isaac, Whitsunday) are
 * tagged with `highlighted: true` so the map can style them differently.
 *
 * Rounds coordinates to 4 decimal places (~10 m accuracy), applies light
 * simplification, and writes to data/qld-lga-boundaries.json.
 *
 * Source: https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/LGA/MapServer/1
 *
 * Usage: node scripts/fetch-lga-boundaries.mjs
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../data/qld-lga-boundaries.json");

const ARCGIS_LAYER_URL =
  "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/LGA/MapServer/1/query";

/** Greater Whitsunday LGAs — these get `highlighted: true`. */
const FOCUS_LGAS = new Set(["Mackay", "Isaac", "Whitsunday"]);

/** Round a number to `dp` decimal places. */
function round(n, dp = 4) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Recursively round all coordinates in nested arrays. */
function roundCoords(coords) {
  if (typeof coords[0] === "number") {
    return [round(coords[0]), round(coords[1])];
  }
  return coords.map((c) => roundCoords(c));
}

/**
 * Thin a ring by dropping points within `tolerance` degrees of the
 * previously kept point.
 */
function simplifyRing(ring, tolerance = 0.005) {
  if (ring.length <= 4) return ring;
  const result = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const prev = result[result.length - 1];
    const dx = ring[i][0] - prev[0];
    const dy = ring[i][1] - prev[1];
    if (Math.sqrt(dx * dx + dy * dy) >= tolerance) {
      result.push(ring[i]);
    }
  }
  result.push(ring[ring.length - 1]);
  return result;
}

function simplifyGeometry(geom, tolerance) {
  if (geom.type === "Polygon") {
    return {
      ...geom,
      coordinates: geom.coordinates.map((ring) => simplifyRing(ring, tolerance)),
    };
  }
  if (geom.type === "MultiPolygon") {
    return {
      ...geom,
      coordinates: geom.coordinates.map((poly) =>
        poly.map((ring) => simplifyRing(ring, tolerance))
      ),
    };
  }
  return geom;
}

function countPoints(geom) {
  const coords = geom.coordinates;
  if (geom.type === "Polygon") {
    return coords.reduce((s, r) => s + r.length, 0);
  }
  if (geom.type === "MultiPolygon") {
    return coords.reduce((s, p) => s + p.reduce((s2, r) => s2 + r.length, 0), 0);
  }
  return 0;
}

async function fetchBatch(offset, limit = 50) {
  const params = new URLSearchParams({
    where: "state_name_2021 = 'Queensland'",
    outFields: "lga_name_2021,lga_code_2021,area_albers_sqkm",
    f: "geojson",
    outSR: "4326",
    returnGeometry: "true",
    resultOffset: String(offset),
    resultRecordCount: String(limit),
    orderByFields: "lga_name_2021",
  });

  const url = `${ARCGIS_LAYER_URL}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`);
  return res.json();
}

async function main() {
  console.log("Fetching ALL QLD LGA boundaries (land-clipped) from ABS ASGS 2021...\n");

  const allFeatures = [];
  let offset = 0;
  const batchSize = 50;

  while (true) {
    console.log(`  Fetching batch at offset ${offset}...`);
    const data = await fetchBatch(offset, batchSize);
    const feats = data.features || [];
    allFeatures.push(...feats);
    console.log(`  Got ${feats.length} features (total: ${allFeatures.length})`);
    if (feats.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`\n  Total QLD LGAs fetched: ${allFeatures.length}\n`);

  // Use a higher simplification tolerance for non-focus LGAs to keep file small
  const FOCUS_TOLERANCE = 0.003;
  const OTHER_TOLERANCE = 0.008;

  const outputFeatures = [];

  for (const feat of allFeatures) {
    if (!feat.geometry || !feat.geometry.coordinates) {
      console.log(`  Skipping ${feat.properties.lga_name_2021} (no geometry)`);
      continue;
    }

    const absName = feat.properties.lga_name_2021;
    const isFocus = FOCUS_LGAS.has(absName);
    const id = absName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const tolerance = isFocus ? FOCUS_TOLERANCE : OTHER_TOLERANCE;

    const rounded = roundCoords(feat.geometry.coordinates);
    const geom = simplifyGeometry(
      { type: feat.geometry.type, coordinates: rounded },
      tolerance
    );

    outputFeatures.push({
      type: "Feature",
      id,
      properties: {
        id,
        name: absName,
        ...(isFocus ? { highlighted: true } : {}),
      },
      geometry: geom,
    });

    if (isFocus) {
      console.log(`  ★ ${absName} (focus): ${geom.type}, ${countPoints(geom)} pts`);
    }
  }

  const fc = {
    type: "FeatureCollection",
    features: outputFeatures,
  };

  const json = JSON.stringify(fc);
  const sizeKB = (Buffer.byteLength(json) / 1024).toFixed(1);
  writeFileSync(OUT_PATH, json + "\n");
  console.log(`\nWritten ${outputFeatures.length} LGAs to ${OUT_PATH} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
