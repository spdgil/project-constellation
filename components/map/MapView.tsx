"use client";

import { useMemo, useState, useEffect } from "react";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import { MapCanvas } from "./MapCanvas";
import type { DealGeoPosition } from "./MapCanvas";
import { DealDrawer } from "./DealDrawer";
import { LgaPanel } from "./LgaPanel";
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

  /* Fetch boundaries client-side if not passed from server */
  useEffect(() => {
    if (boundariesProp?.features?.length) return;
    fetch("/api/boundaries")
      .then((r) => r.json())
      .then((data: GeoJSONFeatureCollection) => {
        if (data?.features?.length) setBoundariesFetched(data);
      })
      .catch(() => {});
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
        const feature = boundaries.features.find(
          (f) =>
            (f.properties?.id as string) === firstLgaId ||
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
        Greater Whitsunday LGA boundaries on a Mapbox light basemap. Click a
        boundary or use the list to open LGA details.
      </p>

      <div className="flex flex-1 min-h-0 border border-[#E8E6E3] bg-[#FAF9F7]">
        <LgaPanel
          lgas={lgas}
          deals={deals}
          selectedLgaId={selectedLgaId}
          onSelectLga={setSelectedLgaId}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
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
