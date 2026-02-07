"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Deal,
  LGA,
  SectorOpportunity,
  SectorDevelopmentStrategy,
} from "@/lib/types";
import type { GeoJSONFeatureCollection } from "@/lib/types";
import type { DealGeoPosition } from "@/components/map/MapCanvas";
import { useDealsWithOverrides } from "@/lib/hooks/useDealsWithOverrides";
import { CONSTRAINT_LABELS } from "@/lib/labels";
import { STAGE_COLOUR_CLASSES } from "@/lib/stage-colours";
import { STAGE_LABELS } from "@/lib/labels";
import { formatAUD, OPP_TYPE_TO_SECTOR } from "@/lib/colour-system";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { AccordionSection } from "@/components/ui/AccordionSection";

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

const EMPTY_BOUNDARIES: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/* -------------------------------------------------------------------------- */
/* Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface LgaDetailProps {
  lga: LGA;
  linkedDeals: Deal[];
  sectorOpportunities: SectorOpportunity[];
  linkedStrategies: SectorDevelopmentStrategy[];
}

/* -------------------------------------------------------------------------- */
/* Shared style constants                                                      */
/* -------------------------------------------------------------------------- */

const cardClass = "bg-white border border-[#E8E6E3] p-5 space-y-3";
const labelClass =
  "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";
const bodyClass = "text-sm text-[#2C2C2C] leading-relaxed";

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function LgaDetail({
  lga,
  linkedDeals: baseDeals,
  sectorOpportunities,
  linkedStrategies,
}: LgaDetailProps) {
  const router = useRouter();
  const deals = useDealsWithOverrides(baseDeals);

  /* ---- Aggregated stats ---- */
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

  /* ---- Sectors active in this LGA ---- */
  const activeSectors = useMemo(() => {
    const sectorIds = new Set<string>();
    for (const deal of deals) {
      const sectorId = OPP_TYPE_TO_SECTOR[deal.opportunityTypeId];
      if (sectorId) sectorIds.add(sectorId);
    }
    return sectorOpportunities.filter((so) => sectorIds.has(so.id));
  }, [deals, sectorOpportunities]);

  /* ---- Boundaries for embedded map ---- */
  const [boundaries, setBoundaries] =
    useState<GeoJSONFeatureCollection>(EMPTY_BOUNDARIES);

  useEffect(() => {
    fetch("/api/boundaries")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoJSONFeatureCollection) => {
        if (data?.features?.length) setBoundaries(data);
      })
      .catch(() => {
        /* silently degrade */
      });
  }, []);

  /* ---- Compute bounding box of this LGA's geometry ---- */
  const lgaBounds = useMemo<
    [[number, number], [number, number]] | undefined
  >(() => {
    const feature = boundaries.features.find(
      (f) =>
        String(f.properties?.id ?? "") === lga.id ||
        (typeof f.id === "string" ? f.id : String(f.id ?? "")) === lga.id,
    );
    if (!feature?.geometry?.coordinates) return undefined;
    let minLng = 180;
    let maxLng = -180;
    let minLat = 90;
    let maxLat = -90;
    const stack: unknown[] = [feature.geometry.coordinates];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!Array.isArray(current)) continue;
      if (typeof current[0] === "number") {
        const lng = current[0] as number;
        const lat = current[1] as number;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else {
        for (let i = current.length - 1; i >= 0; i--) {
          stack.push(current[i]);
        }
      }
    }
    if (minLng > maxLng) return undefined;
    // Add a small padding
    const lngPad = (maxLng - minLng) * 0.15;
    const latPad = (maxLat - minLat) * 0.15;
    return [
      [minLng - lngPad, minLat - latPad],
      [maxLng + lngPad, maxLat + latPad],
    ];
  }, [boundaries, lga.id]);

  /* ---- Deal positions ---- */
  const dealPositions = useMemo(() => {
    const positions: Record<string, DealGeoPosition> = {};
    for (const deal of deals) {
      if (deal.lat != null && deal.lng != null) {
        positions[deal.id] = { lng: deal.lng, lat: deal.lat };
      } else {
        const feature = boundaries.features.find(
          (f) =>
            String(f.properties?.id ?? "") === lga.id ||
            (typeof f.id === "string" ? f.id : String(f.id ?? "")) === lga.id,
        );
        const centroid = feature ? geoCentroid(feature.geometry) : null;
        if (centroid) {
          positions[deal.id] = centroid;
        }
      }
    }
    return positions;
  }, [boundaries, deals, lga.id]);

  /* Navigate to deal on marker click */
  const handleSelectDeal = useCallback(
    (id: string | null) => {
      if (id) router.push(`/deals/${id}`);
    },
    [router],
  );
  const noop = useCallback(() => {}, []);

  /* ---- LGA data ---- */
  const summary =
    lga.summary ??
    `${lga.name} local government area. Place context will appear here when connected.`;
  const hypotheses = lga.opportunityHypotheses ?? [];
  const repeatedConstraints = lga.repeatedConstraints ?? [];
  const evidence = lga.evidence ?? [];
  const notes = lga.notes ?? [];

  return (
    <div className="flex flex-col gap-6" data-testid="lga-detail">
      {/* Back link */}
      <Link
        href="/lga/list"
        className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
      >
        ← All LGAs
      </Link>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Deals"
          value={deals.length > 0 ? String(deals.length) : "—"}
          sub="active in this LGA"
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
          sub="projected GDP"
          colour="emerald"
        />
        <SummaryCard
          label="Jobs identified"
          value={totalJobs > 0 ? totalJobs.toLocaleString() : "—"}
          sub="across active deals"
          colour="emerald"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================================================================ */}
        {/* Main content — 2/3                                                */}
        {/* ================================================================ */}
        <div className="lg:col-span-2 flex flex-col gap-0">
          {/* Hero card */}
          <section
            className="bg-white border border-[#E8E6E3] border-t-[3px] border-t-[#7A6B5A] p-6 space-y-5"
            aria-label="LGA overview"
          >
            <h2 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
              {lga.name}
            </h2>
            <p className={bodyClass}>{summary}</p>
          </section>

          {/* Embedded map */}
          <div
            className="h-[400px] bg-[#FAF9F7] border border-t-0 border-[#E8E6E3] overflow-hidden"
            data-testid="lga-map"
          >
            {lgaBounds ? (
              <MapCanvas
                boundaries={boundaries}
                selectedLgaId={lga.id}
                onSelectLga={noop}
                deals={deals}
                dealPositions={dealPositions}
                selectedDealId={null}
                onSelectDeal={handleSelectDeal}
                initialFitBounds={lgaBounds}
              />
            ) : (
              <div className="h-full w-full bg-[#FAF9F7] animate-pulse" />
            )}
          </div>

          {/* Accordion sections */}
          <div className="bg-white border border-t-0 border-[#E8E6E3] px-6">
            <AccordionSection
              title="Opportunity hypotheses"
              defaultOpen={hypotheses.length > 0}
            >
              {hypotheses.length === 0 ? (
                <p className="text-sm text-[#6B6B6B]">None recorded.</p>
              ) : (
                <div className="space-y-3">
                  {hypotheses.map((h) => (
                    <div
                      key={h.id}
                      className="border border-[#E8E6E3] bg-[#FAF9F7] p-4 space-y-2"
                    >
                      <h4 className="font-heading text-sm font-medium leading-[1.4] text-[#2C2C2C]">
                        {h.name}
                      </h4>
                      {h.summary && (
                        <p className="text-sm text-[#6B6B6B] leading-relaxed">
                          {h.summary}
                        </p>
                      )}
                      {h.dominantConstraint && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                          {CONSTRAINT_LABELS[h.dominantConstraint]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AccordionSection>

            <AccordionSection title="Repeated constraints">
              {repeatedConstraints.length === 0 ? (
                <p className="text-sm text-[#6B6B6B]">None recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {repeatedConstraints.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {CONSTRAINT_LABELS[c]}
                    </span>
                  ))}
                </div>
              )}
            </AccordionSection>

            <AccordionSection title="Evidence and notes">
              <div className="space-y-4">
                {evidence.length > 0 && (
                  <div className="space-y-2">
                    <p className={labelClass}>Evidence</p>
                    <div className="space-y-1.5">
                      {evidence.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-[#2C2C2C] leading-relaxed"
                        >
                          <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[#7A6B5A]" />
                          <span>
                            {e.label ?? e.pageRef ?? "—"}
                            {e.pageRef && e.label && (
                              <span className="ml-1 text-[#9A9A9A]">
                                ({e.pageRef})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {notes.length > 0 && (
                  <div className="space-y-2">
                    <p className={labelClass}>Notes</p>
                    <div className="space-y-1.5">
                      {notes.map((n, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-[#2C2C2C] leading-relaxed"
                        >
                          <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[#9A9A9A]" />
                          <span>
                            {typeof n === "string" ? n : String(n)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {evidence.length === 0 && notes.length === 0 && (
                  <p className="text-sm text-[#6B6B6B]">None recorded.</p>
                )}
              </div>
            </AccordionSection>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Sidebar — 1/3                                                     */}
        {/* ================================================================ */}
        <aside
          className="space-y-4 lg:sticky lg:top-6 lg:self-start"
          aria-label="LGA context"
        >
          {/* ---- Linked strategies ---- */}
          {linkedStrategies.length > 0 && (
            <div className={`${cardClass} border-l-[3px] border-l-emerald-400`}>
              <p className={labelClass}>
                Strategies
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {linkedStrategies.length}
                </span>
              </p>
              <div className="space-y-2">
                {linkedStrategies.map((s) => (
                  <Link
                    key={s.id}
                    href={`/lga/strategies/${s.id}`}
                    className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
                      {s.title}
                    </p>
                    {s.summary && (
                      <p className="text-[10px] text-[#6B6B6B] leading-relaxed line-clamp-2">
                        {s.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ---- Sectors ---- */}
          {activeSectors.length > 0 && (
            <div className={`${cardClass} border-l-[3px] border-l-violet-400`}>
              <p className={labelClass}>
                Sectors
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                  {activeSectors.length}
                </span>
              </p>
              <div className="space-y-2">
                {activeSectors.map((so) => (
                  <Link
                    key={so.id}
                    href={`/sectors/${so.id}`}
                    className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out">
                      {so.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ---- Active deals ---- */}
          <div className={`${cardClass} border-l-[3px] border-l-blue-400`}>
            <p className={labelClass}>
              Active deals
              {deals.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {deals.length}
                </span>
              )}
            </p>
            {deals.length === 0 ? (
              <p className="text-xs text-[#9A9A9A]">No deals in this LGA yet.</p>
            ) : (
              <div className="space-y-2">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="group block border border-[#E8E6E3] bg-[#FAF9F7] p-3 space-y-1.5 hover:border-[#7A6B5A] hover:bg-white transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <p className="text-xs font-medium text-[#2C2C2C] group-hover:text-[#7A6B5A] transition duration-300 ease-out leading-snug">
                      {deal.name}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[#6B6B6B]">
                      {deal.investmentValueAmount > 0 && (
                        <span className="font-medium text-amber-700">
                          {formatAUD(deal.investmentValueAmount)}
                        </span>
                      )}
                      {(deal.economicImpactJobs ?? 0) > 0 && (
                        <span>
                          {deal.economicImpactJobs!.toLocaleString()} jobs
                        </span>
                      )}
                      <span
                        className={`uppercase tracking-wider px-1 py-0.5 ${STAGE_COLOUR_CLASSES[deal.stage]}`}
                      >
                        {STAGE_LABELS[deal.stage]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ---- View on map link ---- */}
          <Link
            href={`/lga/map?lga=${lga.id}`}
            className="block text-center text-sm px-3 py-2 border border-[#E8E6E3] bg-white text-[#7A6B5A] hover:border-[#7A6B5A] hover:bg-[#FAF9F7] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A]"
          >
            View on full map →
          </Link>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Geo helpers                                                                 */
/* -------------------------------------------------------------------------- */

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
