"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Map, {
  Source,
  Layer,
  Marker,
  NavigationControl,
} from "react-map-gl/mapbox";
import type { MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import type { Deal } from "@/lib/types";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * Mapbox light-v11: clean, subtle grey roads/labels on white.
 * Close to monochrome; fits the calm design system.
 */
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

/** Deal position in geographic coordinates. */
export interface DealGeoPosition {
  lng: number;
  lat: number;
}

export interface MapCanvasProps {
  /** LGA boundary GeoJSON. */
  boundaries: GeoJSONFeatureCollection;
  /** Selected LGA id (highlighted on map). */
  selectedLgaId: string | null;
  onSelectLga: (id: string | null) => void;
  /** Deals to render as markers. */
  deals: Deal[];
  /** Geographic position for each deal (keyed by deal.id). */
  dealPositions: Record<string, DealGeoPosition>;
  selectedDealId: string | null;
  onSelectDeal: (id: string | null) => void;
  /** Optional bounds constraint [[sw_lng,sw_lat],[ne_lng,ne_lat]]. */
  maxBounds?: [[number, number], [number, number]];
  /** Override the default initial view (centre + zoom). */
  initialView?: { longitude: number; latitude: number; zoom: number };
  /** When false, skip the fitBounds-to-data-on-load behaviour. Default: true. */
  fitBoundsOnLoad?: boolean;
  /** If set, fit to these bounds on load instead of the LGA data extent. */
  initialFitBounds?: [[number, number], [number, number]];
}

export function MapCanvas({
  boundaries,
  selectedLgaId,
  onSelectLga,
  deals,
  dealPositions,
  selectedDealId,
  onSelectDeal,
  maxBounds,
  initialView,
  fitBoundsOnLoad = true,
  initialFitBounds,
}: MapCanvasProps) {
  const mapRef = useRef<MapRef>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  /* ------------------------------------------------------------------ */
  /* Initial view: centre on Greater Whitsunday region.                  */
  /* Callers can override with the initialView prop.                     */
  /* ------------------------------------------------------------------ */
  const initialViewState = useMemo(
    () => initialView ?? { longitude: 149.0, latitude: -21.1, zoom: 7 },
    [initialView],
  );

  /* Refs to keep handleLoad stable (no dependency-driven recreation).
   * All mutable props that handleLoad reads go through refs so the
   * callback identity NEVER changes — prevents react-map-gl from
   * re-firing onLoad on every render.                                  */
  const hasFittedRef = useRef(false);
  const mapLoadedRef = useRef(false);
  const boundariesRef = useRef(boundaries);
  const initialFitBoundsRef = useRef(initialFitBounds);

  useEffect(() => {
    boundariesRef.current = boundaries;
  }, [boundaries]);

  useEffect(() => {
    initialFitBoundsRef.current = initialFitBounds;
  }, [initialFitBounds]);

  /** Try to fit the map to the best available bounds. Called from
   *  handleLoad (on first map load) and from an effect when
   *  initialFitBounds arrives after mount.                             */
  const fitIfReady = useCallback(() => {
    const map = mapRef.current;
    if (!map || hasFittedRef.current) return;

    /* Fit to caller-provided bounds (e.g. Queensland outline, LGA bbox). */
    const explicitBounds = initialFitBoundsRef.current;
    if (explicitBounds) {
      map.fitBounds(explicitBounds, { padding: 24, duration: 0 });
      hasFittedRef.current = true;
      return;
    }

    if (!fitBoundsOnLoad) {
      hasFittedRef.current = true;
      return;
    }

    const feats = boundariesRef.current.features;
    if (!feats.length) return;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const f of feats) {
      if (!f.geometry?.coordinates) continue;
      walkCoords(f.geometry.coordinates, (lng, lat) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
    }

    if (!isFinite(minLng)) return;

    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 48, duration: 0 },
    );
    hasFittedRef.current = true;
  }, [fitBoundsOnLoad]);

  /** On load: resize then attempt initial fit. Fully ref-based so the
   *  callback identity is stable across renders.                       */
  const handleLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    mapLoadedRef.current = true;
    fitIfReady();
  }, [fitIfReady]);


  /* ------------------------------------------------------------------ */
  /* Click handler: LGA fill layer → select; empty → deselect           */
  /* ------------------------------------------------------------------ */
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const features = e.features;
      if (features && features.length > 0) {
        const clickedId = features[0].properties?.id as string | undefined;
        if (clickedId) {
          onSelectLga(selectedLgaId === clickedId ? null : clickedId);
          return;
        }
      }
      onSelectLga(null);
    },
    [selectedLgaId, onSelectLga],
  );

  /* ------------------------------------------------------------------ */
  /* Filter expression to highlight the selected LGA                    */
  /* ------------------------------------------------------------------ */
  const selectedFilter = useMemo(
    () =>
      selectedLgaId
        ? (["==", ["get", "id"], selectedLgaId] as unknown as mapboxgl.Expression)
        : (["==", ["get", "id"], ""] as unknown as mapboxgl.Expression),
    [selectedLgaId],
  );

  /* ------------------------------------------------------------------ */
  /* Fly to the selected LGA's bounds when selection changes.           */
  /* Skip when initialFitBounds is provided — the LGA is already framed */
  /* by fitIfReady, so a duplicate fly-to would fight the initial fit.  */
  /* ------------------------------------------------------------------ */
  const prevSelectedRef = useRef(selectedLgaId);
  useEffect(() => {
    /* Skip on first render — initialFitBounds already handles framing */
    if (prevSelectedRef.current === selectedLgaId && initialFitBounds) {
      prevSelectedRef.current = selectedLgaId;
      return;
    }
    prevSelectedRef.current = selectedLgaId;

    const map = mapRef.current;
    if (!map || !selectedLgaId) return;

    const feature = boundaries.features.find(
      (f) => String(f.properties?.id ?? "") === selectedLgaId,
    );
    if (!feature?.geometry?.coordinates) return;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    walkCoords(feature.geometry.coordinates, (lng, lat) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    if (!isFinite(minLng)) return;

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, duration: 800, maxZoom: 11 },
    );
  }, [selectedLgaId, boundaries, initialFitBounds]);

  /* ------------------------------------------------------------------ */
  /* Missing-token fallback                                             */
  /* ------------------------------------------------------------------ */
  if (!token) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full min-h-[400px] border border-[#E8E6E3] bg-[#FAF9F7] p-8 text-center"
        role="alert"
      >
        <p className="text-sm text-[#2C2C2C] leading-relaxed mb-2">
          Mapbox token not configured.
        </p>
        <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-md">
          Create a free account at{" "}
          <a
            href="https://account.mapbox.com/auth/signup/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-[#7A6B5A] hover:text-[#5A4B3A]"
          >
            mapbox.com
          </a>
          , then add your public token to{" "}
          <code className="text-[#2C2C2C]">.env.local</code> as{" "}
          <code className="text-[#2C2C2C]">NEXT_PUBLIC_MAPBOX_TOKEN</code> and
          restart the dev server.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-h-[400px] border border-[#E8E6E3]"
      data-testid="map-canvas"
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%", flex: 1 }}
        mapStyle={MAP_STYLE}
        projection="mercator"
        interactiveLayerIds={["lga-fill"]}
        onClick={handleMapClick}
        onLoad={handleLoad}
        cursor="pointer"
        {...(maxBounds ? { maxBounds } : {})}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* --- LGA boundaries ---------------------------------------- */}
        <Source
          id="lga-boundaries"
          type="geojson"
          data={boundaries as GeoJSON.FeatureCollection}
        >
          {/* Fill: focus LGAs get a subtle tint, others are transparent */}
          <Layer
            id="lga-fill"
            type="fill"
            paint={{
              "fill-color": [
                "case",
                ["==", ["get", "highlighted"], true],
                "#E8E6E3",
                "transparent",
              ] as unknown as mapboxgl.Expression,
              "fill-opacity": [
                "case",
                ["==", ["get", "highlighted"], true],
                0.15,
                0,
              ] as unknown as mapboxgl.Expression,
            }}
          />
          {/* Boundary stroke: focus LGAs bold, others light */}
          <Layer
            id="lga-line"
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["get", "highlighted"], true],
                "#2C2C2C",
                "#C8C4BF",
              ] as unknown as mapboxgl.Expression,
              "line-width": [
                "case",
                ["==", ["get", "highlighted"], true],
                1.8,
                0.6,
              ] as unknown as mapboxgl.Expression,
            }}
          />
          {/* Highlighted fill for selected LGA */}
          <Layer
            id="lga-fill-selected"
            type="fill"
            filter={selectedFilter}
            paint={{
              "fill-color": "#E8E6E3",
              "fill-opacity": 0.35,
            }}
          />
          {/* Heavier stroke for selected LGA */}
          <Layer
            id="lga-line-selected"
            type="line"
            filter={selectedFilter}
            paint={{
              "line-color": "#2C2C2C",
              "line-width": 2.5,
            }}
          />
        </Source>

        {/* --- Deal markers ------------------------------------------ */}
        {deals.map((deal) => {
          const pos = dealPositions[deal.id];
          if (!pos) return null;
          const isSelected = selectedDealId === deal.id;
          return (
            <Marker
              key={deal.id}
              longitude={pos.lng}
              latitude={pos.lat}
              anchor="center"
            >
              <button
                type="button"
                data-deal-marker={deal.id}
                aria-label={`Deal: ${deal.name}. Select to view details.`}
                aria-pressed={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDeal(selectedDealId === deal.id ? null : deal.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectDeal(selectedDealId === deal.id ? null : deal.id);
                  }
                }}
                className={`w-4 h-4 border-2 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-[#7A6B5A] bg-[#F5F3F0]"
                    : "border-[#2C2C2C] bg-[#FAF9F7] hover:border-[#7A6B5A] hover:bg-[#F5F3F0]"
                }`}
                data-pressed={isSelected || undefined}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}

/** Walk nested GeoJSON coordinate arrays (iterative to avoid stack overflow). */
function walkCoords(
  coords: unknown,
  fn: (lng: number, lat: number) => void,
): void {
  const stack: unknown[] = [coords];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!Array.isArray(current)) continue;
    if (typeof current[0] === "number") {
      fn(current[0] as number, current[1] as number);
    } else {
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push(current[i]);
      }
    }
  }
}
