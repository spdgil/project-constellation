"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import { useBoundaries } from "@/lib/hooks/useBoundaries";
import type { DealGeoPosition } from "./MapCanvas";
import { DealDrawer } from "./DealDrawer";
import { LgaPanel } from "./LgaPanel";
import { LgaBottomSheet } from "./LgaBottomSheet";

const MapCanvas = dynamic(
  () => import("./MapCanvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => <div className="flex-1 bg-[#F5F1EB] animate-pulse" />,
  },
);

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

  const { boundaries, boundaryError } = useBoundaries(boundariesProp);

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

  const selectedLga = useMemo(
    () => (selectedLgaId ? lgas.find((l) => l.id === selectedLgaId) ?? null : null),
    [selectedLgaId, lgas],
  );

  const handleCloseLga = useCallback(() => setSelectedLgaId(null), []);
  const handleCloseDeal = useCallback(() => setSelectedDealId(null), []);

  const selectedDeal = selectedDealId
    ? (deals.find((d) => d.id === selectedDealId) ?? null)
    : null;
  const selectedLgaName = selectedLgaId
    ? lgas.find((l) => l.id === selectedLgaId)?.name ?? null
    : null;
  const liveMessage = selectedDeal
    ? `Selected deal: ${selectedDeal.name}`
    : selectedLgaName
      ? `Selected LGA: ${selectedLgaName}`
      : "No selection";

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      {boundaryError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 mb-2" role="alert">
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
          {selectedLga && (
            <LgaBottomSheet
              lga={selectedLga}
              deals={deals}
              onClose={handleCloseLga}
            />
          )}
        </div>
        {selectedDeal && (
          <DealDrawer
            key={selectedDeal.id}
            deal={selectedDeal}
            opportunityTypes={opportunityTypes}
            lgas={lgas}
            onClose={handleCloseDeal}
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
