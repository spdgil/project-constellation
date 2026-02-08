/**
 * Shared hook for fetching LGA boundary GeoJSON.
 * Replaces duplicated fetch logic in HomeView, MapView, LgaDetail, and StateView.
 */

"use client";

import { useState, useEffect } from "react";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import { logClientError } from "@/lib/client-logger";

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
    const controller = new AbortController();
    fetch("/api/boundaries", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoJSONFeatureCollection) => {
        if (data?.features?.length) setFetched(data);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        logClientError(
          "Failed to fetch LGA boundaries",
          { error: String(err) },
          "useBoundaries",
        );
        setError(
          "Could not load LGA boundaries. The map may be incomplete.",
        );
      });
    return () => controller.abort();
  }, [hasOverride]);

  return {
    boundaries: hasOverride ? override! : fetched,
    boundaryError: error,
  };
}
