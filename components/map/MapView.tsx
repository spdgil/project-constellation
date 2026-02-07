"use client";

import { useMemo, useState, useEffect } from "react";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import { MapCanvas } from "./MapCanvas";
import type { DealGeoPosition } from "./MapCanvas";
import { DealDrawer } from "./DealDrawer";
import { LgaPanel } from "./LgaPanel";
import { LgaBottomSheet } from "./LgaBottomSheet";
import Link from "next/link";

const EMPTY_BOUNDARIES: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export interface MapViewProps {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
  boundaries?: GeoJSONFeatureCollection | null;
}

export function MapView({
  lgas,
  deals,
  opportunityTypes,
  boundaries: boundariesProp,
}: MapViewProps) {
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [boundariesFetched, setBoundariesFetched] =
    useState<GeoJSONFeatureCollection | null>(null);

  const boundaries =
    boundariesProp?.features?.length
      ? boundariesProp
      : boundariesFetched ?? EMPTY_BOUNDARIES;

  const [boundaryError, setBoundaryError] = useState<string | null>(null);

  /* Fetch boundaries client-side if not passed from server */
  useEffect(() => {
    if (boundariesProp?.features?.length) return;
    fetch("/api/boundaries")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoJSONFeatureCollection) => {
        if (data?.features?.length) setBoundariesFetched(data);
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch LGA boundaries:", err);
        setBoundaryError("Could not load LGA boundaries. The map may be incomplete.");
      });
  }, [boundariesProp?.features?.length]);

  /* ------------------------------------------------------------------ */
  /* Compute geographic (lng, lat) positions for each deal              */
  /* Deals with explicit lat/lng use those; others use LGA centroid.    */
  /* ------------------------------------------------------------------ */
  const dealPositions = useMemo(() => {
    const positions: Record<string, DealGeoPosition> = {};

    for (const deal of deals) {
      if (deal.lat != null && deal.lng != null) {
        positions[deal.id] = { lng: deal.lng, lat: deal.lat };
      } else {
        const firstLgaId = deal.lgaIds[0];
        if (!firstLgaId) continue;
        const feature = boundaries.features.find(
          (f) =>
            String(f.properties?.id ?? "") === firstLgaId ||
            (typeof f.id === "string" ? f.id : String(f.id ?? "")) ===
              firstLgaId,
        );
        const centroid = feature ? geoCentroid(feature.geometry) : null;
        if (centroid) {
          positions[deal.id] = centroid;
        }
      }
    }

    return positions;
  }, [boundaries, deals]);

  const selectedDeal = selectedDealId
    ? (deals.find((d) => d.id === selectedDealId) ?? null)
    : null;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
          Explore by map
        </h1>
        <Link
          href="/"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4">
        Click a boundary or use the sidebar to explore LGA details and deals.
      </p>

      {boundaryError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 mb-4" role="alert">
          {boundaryError}
        </p>
      )}

      <div className="flex flex-1 min-h-0 border border-[#E8E6E3] bg-[#FAF9F7]">
        <LgaPanel
          lgas={lgas}
          selectedLgaId={selectedLgaId}
          onSelectLga={setSelectedLgaId}
        />
        {/* Map + bottom-sheet in a flex column — map shrinks as sheet grows */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <MapCanvas
              boundaries={boundaries}
              selectedLgaId={selectedLgaId}
              onSelectLga={setSelectedLgaId}
              deals={deals}
              dealPositions={dealPositions}
              selectedDealId={selectedDealId}
              onSelectDeal={setSelectedDealId}
            />
          </div>
          {selectedLgaId && (() => {
            const lga = lgas.find((l) => l.id === selectedLgaId);
            if (!lga) return null;
            return (
              <LgaBottomSheet
                lga={lga}
                deals={deals}
                onClose={() => setSelectedLgaId(null)}
              />
            );
          })()}
        </div>
        {selectedDeal && (
          <DealDrawer
            deal={selectedDeal}
            opportunityTypes={opportunityTypes}
            lgas={lgas}
            onClose={() => setSelectedDealId(null)}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Compute geographic centroid from the first ring of a GeoJSON geom.   */
/* -------------------------------------------------------------------- */
function geoCentroid(
  geometry: { type: string; coordinates: unknown } | null | undefined,
): DealGeoPosition | null {
  if (!geometry?.coordinates) return null;
  const ring = firstRing(geometry.coordinates);
  if (!ring || ring.length === 0) return null;
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return { lng: sumLng / ring.length, lat: sumLat / ring.length };
}

function firstRing(coords: unknown): number[][] | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  if (typeof coords[0] === "number") return null;
  const first = coords[0];
  if (!Array.isArray(first) || first.length === 0) return null;
  if (typeof first[0] === "number") return coords as number[][];
  if (Array.isArray(first[0]) && typeof first[0][0] === "number")
    return first as number[][];
  const poly = (coords as number[][][][])[0];
  return poly?.[0] ?? null;
}
