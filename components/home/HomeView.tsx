"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Deal } from "@/lib/types";
import type { DealGeoPosition } from "@/components/map/MapCanvas";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { useBoundaries } from "@/lib/hooks/useBoundaries";
import { formatAUD } from "@/lib/colour-system";
import { SummaryCard } from "@/components/ui/SummaryCard";

/* Lazy-load MapCanvas — avoids shipping Mapbox JS on first paint */
const MapCanvas = dynamic(
  () => import("@/components/map/MapCanvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#FAF9F7] animate-pulse rounded" />
    ),
  },
);

/** Queensland bounds — used for both the initial fit and pan constraint. */
const QLD_BOUNDS: [[number, number], [number, number]] = [
  [137, -30],   // SW corner (SA border / NSW border)
  [155, -9.5],  // NE corner (Cape York / coast)
];

/* ====================================================================== */
/* Props                                                                  */
/* ====================================================================== */

export interface HomeViewProps {
  deals: Deal[];
}

/* ====================================================================== */
/* Root component                                                         */
/* ====================================================================== */

export function HomeView({ deals: baseDeals }: HomeViewProps) {
  const router = useRouter();
  const deals = useDealsWithOverrides(baseDeals);

  /* ---- Computed metrics ---- */
  const totalInvestment = useMemo(
    () => deals.reduce((s, d) => s + (d.investmentValueAmount ?? 0), 0),
    [deals],
  );
  const totalImpact = useMemo(
    () => deals.reduce((s, d) => s + (d.economicImpactAmount ?? 0), 0),
    [deals],
  );
  const totalJobs = useMemo(
    () => deals.reduce((s, d) => s + (d.economicImpactJobs ?? 0), 0),
    [deals],
  );

  /* ---- Boundaries for embedded map ---- */
  const { boundaries } = useBoundaries();

  /* ---- Deal positions (same logic as MapView) ---- */
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
            (typeof f.id === "string" ? f.id : String(f.id ?? "")) === firstLgaId,
        );
        const centroid = feature ? geoCentroid(feature.geometry) : null;
        if (centroid) {
          positions[deal.id] = centroid;
        }
      }
    }
    return positions;
  }, [boundaries, deals]);

  /* Navigate to deal on marker click */
  const handleSelectDeal = useCallback(
    (id: string | null) => {
      if (id) router.push(`/deals/${id}`);
    },
    [router],
  );
  const noop = useCallback(() => {}, []);

  return (
    <div className="flex flex-col gap-8" data-testid="home-view">
      {/* ── Hero: text + stats (left) | map (right) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:h-[860px]">
        {/* Left column — intro, summary cards, nav links */}
        <div
          className="flex flex-col gap-6 pt-16 lg:pt-24"
          data-testid="summary-bar"
        >
          {/* Introduction */}
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-lg">
            Developing a coordinated investment pipeline for Queensland,
            connecting sectors, local government areas, and deal-ready
            opportunities to accelerate economic development and build
            resilience.
          </p>

          {/* Key metrics — 2×2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="Total deals"
              value={String(deals.length)}
              sub="across all sectors"
              colour="blue"
            />
            <SummaryCard
              label="Investment"
              value={totalInvestment > 0 ? formatAUD(totalInvestment) : "—"}
              sub="total deal value"
              colour="amber"
            />
            <SummaryCard
              label="Economic impact"
              value={totalImpact > 0 ? formatAUD(totalImpact) : "—"}
              sub="projected GDP contribution"
              colour="emerald"
            />
            <SummaryCard
              label="Jobs identified"
              value={totalJobs > 0 ? totalJobs.toLocaleString() : "—"}
              sub="across active deals"
              colour="emerald"
            />
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-3 gap-3" data-testid="nav-links">
            <NavLink href="/deals/list" label="Deals" sub="Browse the pipeline" />
            <NavLink href="/sectors" label="Sectors" sub="By opportunity type" />
            <NavLink href="/lga" label="LGA" sub="Local government areas" />
          </div>
        </div>

        {/* Right column — map */}
        <div
          className="h-[560px] lg:h-full rounded-lg overflow-hidden bg-[#FAF9F7]"
          data-testid="map-container"
        >
          <MapCanvas
            boundaries={boundaries}
            selectedLgaId={null}
            onSelectLga={noop}
            deals={deals}
            dealPositions={dealPositions}
            selectedDealId={null}
            onSelectDeal={handleSelectDeal}
            initialFitBounds={QLD_BOUNDS}
            maxBounds={QLD_BOUNDS}
          />
        </div>
      </div>

    </div>
  );
}

/* ====================================================================== */
/* Sub-components                                                         */
/* ====================================================================== */

function NavLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col bg-white border border-[#E8E6E3] px-4 py-3
                 hover:border-[#7A6B5A] hover:bg-[#FAF9F7]
                 transition-colors duration-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A]"
    >
      <span className="text-sm font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition-colors duration-200">
        {label} <span aria-hidden="true" className="text-[#9A9A9A] group-hover:text-[#7A6B5A]">&rarr;</span>
      </span>
      <span className="text-[11px] text-[#9A9A9A] mt-0.5">{sub}</span>
    </Link>
  );
}

/* ====================================================================== */
/* Geo helpers (extracted from MapView)                                    */
/* ====================================================================== */

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
