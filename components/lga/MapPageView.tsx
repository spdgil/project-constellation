"use client";

import dynamic from "next/dynamic";
import type { Deal, LGA, OpportunityType } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-[600px] bg-[#FAF9F7] animate-pulse" /> },
);

export interface MapPageViewProps {
  lgas: LGA[];
  deals: Deal[];
  opportunityTypes: OpportunityType[];
}

/**
 * Full-page map view for the /lga/map route.
 * Wraps MapView with responsive height.
 */
export function MapPageView({ lgas, deals, opportunityTypes }: MapPageViewProps) {
  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <MapView lgas={lgas} deals={deals} opportunityTypes={opportunityTypes} />
    </div>
  );
}
