/**
 * POST /api/geocode
 *
 * Forward-geocode a location string using the Mapbox Geocoding API v6.
 * Returns lat/lng coordinates biased to Queensland, Australia.
 * Server-side only — keeps the Mapbox token on the server.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimitOrResponse, requireAuthOrResponse } from "@/lib/api-guards";
import { readJsonWithLimit } from "@/lib/request-utils";

// Queensland bounding box (covers all 77 LGAs)
const QLD_BBOX = "138,-29,154,-10";

const GeocodeRequestSchema = z.object({
  query: z.string().max(200),
});

interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  /** Mapbox confidence level for the result */
  confidence: string | null;
  /** The matched place name returned by Mapbox */
  matchedPlace: string | null;
}

/** Forward-geocode a location string to lat/lng within QLD. */
export async function POST(request: Request) {
  try {
    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "geocode",
      30,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await readJsonWithLimit<{ query?: string }>(request, 4096);
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status ?? 400 });
    }
    const body = parsedBody.data!;
    const parsed = GeocodeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const query = parsed.data.query.trim();
    if (!query) {
      return NextResponse.json(
        { lat: null, lng: null, confidence: null, matchedPlace: null },
        { status: 200 }
      );
    }

    const token = env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      logger.error("NEXT_PUBLIC_MAPBOX_TOKEN not set");
      return NextResponse.json(
        { lat: null, lng: null, confidence: null, matchedPlace: null },
        { status: 200 }
      );
    }

    const params = new URLSearchParams({
      q: query,
      access_token: token,
      bbox: QLD_BBOX,
      country: "AU",
      limit: "1",
    });

    const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (!res.ok) {
      logger.error("Mapbox API error", { status: res.status });
      return NextResponse.json(
        { lat: null, lng: null, confidence: null, matchedPlace: null },
        { status: 200 }
      );
    }

    const data = await res.json();
    const feature = data?.features?.[0];

    if (!feature?.geometry?.coordinates) {
      return NextResponse.json(
        { lat: null, lng: null, confidence: null, matchedPlace: null },
        { status: 200 }
      );
    }

    const [lng, lat] = feature.geometry.coordinates as [number, number];
    const confidence =
      feature.properties?.match_code?.confidence ?? feature.properties?.relevance ?? null;
    const matchedPlace =
      feature.properties?.full_address ?? feature.properties?.name ?? null;

    const result: GeocodeResult = { lat, lng, confidence, matchedPlace };
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Geocode error", { error: String(error) });
    return NextResponse.json(
      { lat: null, lng: null, confidence: null, matchedPlace: null },
      { status: 200 }
    );
  }
}
