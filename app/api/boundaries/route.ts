/**
 * GET /api/boundaries
 *
 * Returns QLD LGA boundary GeoJSON data.
 * Data is bundled at build time from data/qld-lga-boundaries.json.
 * Aggressively cached — boundaries rarely change.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { rateLimitOrResponse } from "@/lib/api-guards";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import boundaryData from "@/data/qld-lga-boundaries.json";

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "boundaries-read",
      120,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    return NextResponse.json(boundaryData as GeoJSONFeatureCollection, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    logger.error("Failed to load LGA boundaries", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load boundary data" },
      { status: 500 },
    );
  }
}
