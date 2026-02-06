"use client";

import { useMemo, useCallback, useState } from "react";
import type { Deal, LGA, OpportunityType } from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import {
  getBounds,
  createProjector,
  featuresToPathData,
  getFeatureCentroid,
} from "@/lib/geojson";
import { MapCanvas } from "./MapCanvas";
import { DealMarker } from "./DealMarker";
import { DealDrawer } from "./DealDrawer";
import { LgaPanel } from "./LgaPanel";
import Link from "next/link";

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

/** Default marker position (map units) when deal has no lat/lng and no LGA centroid */
const DEFAULT_MARKER = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };

export interface MapViewProps {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
  boundaries: GeoJSONFeatureCollection;
}

export function MapView({
  lgas,
  deals,
  opportunityTypes,
  boundaries,
}: MapViewProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const { lgaPaths, dealPositions } = useMemo(() => {
    const bounds = getBounds(boundaries);
    const project = createProjector(bounds, MAP_WIDTH, MAP_HEIGHT);
    const allPaths = featuresToPathData(boundaries, project);
    const lgaIds = new Set(lgas.map((l) => l.id));
    const paths = allPaths.filter(
      (p) => lgaIds.has(p.id) || lgas.some((l) => l.geometryRef === p.id)
    );
    const positions: Record<string, { x: number; y: number }> = {};
    for (const deal of deals) {
      if (deal.lat != null && deal.lng != null) {
        const p = project(deal.lng, deal.lat);
        positions[deal.id] = p;
      } else {
        const firstLgaId = deal.lgaIds[0];
        const feature = boundaries.features.find(
          (f) =>
            (f.properties?.id as string) === firstLgaId ||
            (typeof f.id === "string" ? f.id : String(f.id ?? "")) === firstLgaId
        );
        const centroid = feature
          ? getFeatureCentroid(feature, project)
          : null;
        positions[deal.id] = centroid ?? DEFAULT_MARKER;
      }
    }
    return { lgaPaths: paths, dealPositions: positions };
  }, [boundaries, deals]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(3, z + 0.25));
  }, []);
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z - 0.25));
  }, []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  const selectedDeal = selectedDealId
    ? deals.find((d) => d.id === selectedDealId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-4 mb-4">
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

      <div className="flex flex-1 min-h-0 border border-[#E8E6E3] bg-[#FAF9F7]">
        <LgaPanel
          lgas={lgas}
          deals={deals}
          selectedLgaId={selectedLgaId}
          onSelectLga={setSelectedLgaId}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <MapCanvas
            lgaPaths={lgaPaths}
            mapWidth={MAP_WIDTH}
            mapHeight={MAP_HEIGHT}
            selectedLgaId={selectedLgaId}
            onSelectLga={setSelectedLgaId}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleZoomReset}
          >
            {deals.map((deal) => {
              const pos = dealPositions[deal.id] ?? DEFAULT_MARKER;
              return (
                <DealMarker
                  key={deal.id}
                  dealId={deal.id}
                  dealName={deal.name}
                  x={pos.x}
                  y={pos.y}
                  positionUnit="px"
                  selected={selectedDealId === deal.id}
                  onSelect={() =>
                    setSelectedDealId(
                      selectedDealId === deal.id ? null : deal.id
                    )
                  }
                />
              );
            })}
          </MapCanvas>
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
