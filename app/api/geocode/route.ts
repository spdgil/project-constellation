/**
 * POST /api/geocode
 *
 * Forward-geocode a location string using the Mapbox Geocoding API v6.
 * Returns lat/lng coordinates biased to Queensland, Australia.
 * Server-side only — keeps the Mapbox token on the server.
 */

import { NextResponse } from "next/server";

// Queensland bounding box (covers all 77 LGAs)
const QLD_BBOX = "138,-29,154,-10";

interface GeocodeRequest {
  query: string;
}

interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  /** Mapbox confidence level for the result */
  confidence: string | null;
  /** The matched place name returned by Mapbox */
  matchedPlace: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeocodeRequest;

    if (!body.query || typeof body.query !== "string" || !body.query.trim()) {
      return NextResponse.json(
        { lat: null, lng: null, confidence: null, matchedPlace: null },
        { status: 200 }
      );
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("[geocode] NEXT_PUBLIC_MAPBOX_TOKEN not set");
      return NextResponse.json(
        { lat: null, lng: null, confidence: null, matchedPlace: null },
        { status: 200 }
      );
    }

    const params = new URLSearchParams({
      q: body.query.trim(),
      access_token: token,
      bbox: QLD_BBOX,
      country: "AU",
      limit: "1",
    });

    const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`[geocode] Mapbox API error: ${res.status}`);
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
    console.error("[geocode] Error:", error);
    return NextResponse.json(
      { lat: null, lng: null, confidence: null, matchedPlace: null },
      { status: 200 }
    );
  }
}
