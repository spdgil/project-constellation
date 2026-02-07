/**
 * Shared hook for fetching LGA boundary GeoJSON.
 * Replaces duplicated fetch logic in HomeView, MapView, LgaDetail, and StateView.
 */

"use client";

import { useState, useEffect } from "react";
import type { GeoJSONFeatureCollection } from "@/lib/types";

const EMPTY_BOUNDARIES: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/**
 * Fetches LGA boundaries from `/api/boundaries`.
 * Returns the fetched collection (or a provided override) and an error string.
 *
 * @param override — If a non-empty collection is passed, the fetch is skipped.
 */
export function useBoundaries(
  override?: GeoJSONFeatureCollection | null,
): {
  boundaries: GeoJSONFeatureCollection;
  boundaryError: string | null;
} {
  const hasOverride = !!(override?.features?.length);
  const [fetched, setFetched] = useState<GeoJSONFeatureCollection>(EMPTY_BOUNDARIES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasOverride) return;
    fetch("/api/boundaries")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoJSONFeatureCollection) => {
        if (data?.features?.length) setFetched(data);
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch LGA boundaries:", err);
        setError(
          "Could not load LGA boundaries. The map may be incomplete.",
        );
      });
  }, [hasOverride]);

  return {
    boundaries: hasOverride ? override! : fetched,
    boundaryError: error,
  };
}
