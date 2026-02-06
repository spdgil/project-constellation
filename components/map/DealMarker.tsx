"use client";

export interface DealMarkerProps {
  dealId: string;
  dealName: string;
  /** X position: percentage (0–100) when positionUnit is 'percent', or pixels when 'px' */
  x: number;
  /** Y position: percentage (0–100) when positionUnit is 'percent', or pixels when 'px' */
  y: number;
  /** Position units; use 'px' when markers are in the same coordinate system as the map SVG */
  positionUnit?: "percent" | "px";
  selected?: boolean;
  onSelect: () => void;
}

export function DealMarker({
  dealId,
  dealName,
  x,
  y,
  positionUnit = "percent",
  selected,
  onSelect,
}: DealMarkerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  const isPx = positionUnit === "px";
  const style: React.CSSProperties = isPx
    ? { left: x, top: y, transform: "translate(-50%, -50%)" }
    : { left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" };

  return (
    <button
      type="button"
      data-deal-marker={dealId}
      aria-label={`Deal: ${dealName}. Select to view details.`}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="absolute w-4 h-4 border-2 border-[#E8E6E3] bg-[#FAF9F7] hover:border-[#7A6B5A] hover:bg-[#F5F3F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C2C2C] transition duration-300 ease-out data-[pressed=true]:border-[#7A6B5A] data-[pressed=true]:bg-[#F5F3F0] pointer-events-auto"
      style={style}
      data-pressed={selected ?? undefined}
    />
  );
}
