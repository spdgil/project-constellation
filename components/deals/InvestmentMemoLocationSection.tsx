interface InvestmentMemoLocationSectionProps {
  draftLocationText: string;
  applied: boolean;
  isGeocoding: boolean;
  geocodeStatus: "idle" | "pending" | "success" | "failed";
  draftLat: number | null;
  draftLng: number | null;
  geocodeMatchedPlace: string | null;
  onLocationChange: (value: string) => void;
  onGeocode: (query: string) => void;
}

export function InvestmentMemoLocationSection({
  draftLocationText,
  applied,
  isGeocoding,
  geocodeStatus,
  draftLat,
  draftLng,
  geocodeMatchedPlace,
  onLocationChange,
  onGeocode,
}: InvestmentMemoLocationSectionProps) {
  return (
    <div className="p-5 space-y-2">
      <label htmlFor="draft-location" className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
        Location
      </label>
      <div className="flex gap-2">
        <input
          id="draft-location"
          type="text"
          value={draftLocationText}
          onChange={(e) => onLocationChange(e.target.value)}
          disabled={applied}
          className="flex-1 text-sm text-[#2C2C2C] border border-[#E8E6E3] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed"
          placeholder="e.g. Paget Industrial Estate, Mackay, QLD"
        />
        {!applied && (
          <button
            type="button"
            disabled={isGeocoding || !draftLocationText.trim()}
            onClick={() => onGeocode(draftLocationText)}
            className="shrink-0 text-xs px-3 py-2 border border-[#E8E6E3] bg-[#FAF9F7] text-[#6B6B6B] hover:border-[#C8C4BF] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isGeocoding ? "Geocoding…" : "Geocode"}
          </button>
        )}
      </div>

      {/* Status */}
      {geocodeStatus === "pending" && (
        <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 border border-[#E8E6E3] border-t-[#2C2C2C] rounded-full animate-spin" />
          Geocoding location…
        </p>
      )}
      {geocodeStatus === "success" && draftLat !== null && draftLng !== null && (
        <p className="text-xs text-emerald-700">
          Geocoded to {draftLat.toFixed(4)}, {draftLng.toFixed(4)}
          {geocodeMatchedPlace && (
            <span className="text-[#6B6B6B]"> — {geocodeMatchedPlace}</span>
          )}
        </p>
      )}
      {geocodeStatus === "failed" && (
        <p className="text-xs text-amber-700">
          Could not geocode — the deal will use the LGA centroid as a fallback
        </p>
      )}
    </div>
  );
}
