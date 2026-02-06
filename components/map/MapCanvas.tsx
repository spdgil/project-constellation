"use client";

import { useCallback, useRef, useState } from "react";
import type { LgaPathFeature } from "@/lib/geojson";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export interface MapCanvasProps {
  /** LGA boundary paths (SVG path d strings) for rendering */
  lgaPaths: LgaPathFeature[];
  /** Map content size in projected units (matches SVG viewBox) */
  mapWidth: number;
  mapHeight: number;
  selectedLgaId: string | null;
  onSelectLga: (id: string | null) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

export function MapCanvas({
  lgaPaths,
  mapWidth,
  mapHeight,
  selectedLgaId,
  onSelectLga,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  children,
}: MapCanvasProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const handleZoomIn = useCallback(() => onZoomIn(), [onZoomIn]);
  const handleZoomOut = useCallback(() => onZoomOut(), [onZoomOut]);

  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
      dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [pan]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setPan({
      x: dragStart.current.panX + e.clientX - dragStart.current.x,
      y: dragStart.current.panY + e.clientY - dragStart.current.y,
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStart.current) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      dragStart.current = null;
    }
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) onZoomIn();
      else if (e.deltaY > 0) onZoomOut();
    },
    [onZoomIn, onZoomOut]
  );

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-white border border-[#E8E6E3]">
      <div className="flex items-center justify-between gap-2 p-2 border-b border-[#E8E6E3] bg-[#F5F3F0]">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wider">
          Map canvas
        </span>
        <div className="flex items-center gap-2" role="group" aria-label="Map zoom controls">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!canZoomOut}
            aria-label="Zoom out"
            className="min-w-[36px] h-9 px-2 border border-[#E8E6E3] bg-transparent text-[#2C2C2C] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            −
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={!canZoomIn}
            aria-label="Zoom in"
            className="min-w-[36px] h-9 px-2 border border-[#E8E6E3] bg-transparent text-[#2C2C2C] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            +
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset zoom"
            className="h-9 px-3 border border-[#E8E6E3] bg-transparent text-[#2C2C2C] text-sm hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            Reset
          </button>
        </div>
      </div>
      <div
        className="flex-1 relative overflow-hidden bg-[#FAF9F7]"
        onWheel={onWheel}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center origin-center transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          role="application"
          aria-label="Map: pan with drag, zoom with buttons or wheel. Click an LGA to open details."
        >
          <div
            className="relative bg-[#FFFFFF] border border-[#E8E6E3]"
            style={{ width: mapWidth, height: mapHeight }}
          >
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <g fill="#FFFFFF" stroke="#2C2C2C" strokeWidth={1}>
                {lgaPaths.map((lga) => (
                  <path
                    key={lga.id}
                    d={lga.pathD}
                    fill="transparent"
                    stroke={selectedLgaId === lga.id ? "#2C2C2C" : "#E8E6E3"}
                    strokeWidth={selectedLgaId === lga.id ? 2 : 1}
                  />
                ))}
              </g>
            </svg>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ background: "transparent" }}
              aria-hidden
            >
              {lgaPaths.map((lga) => (
                <path
                  key={`hit-${lga.id}`}
                  d={lga.pathD}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={8}
                  cursor="pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`${lga.name} (LGA). Click to open details.`}
                  data-testid={`lga-polygon-${lga.id}`}
                  onClick={() => onSelectLga(selectedLgaId === lga.id ? null : lga.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectLga(selectedLgaId === lga.id ? null : lga.id);
                    }
                  }}
                />
              ))}
            </svg>
            <div className="absolute inset-0 pointer-events-none [&_.pointer-events-auto]:pointer-events-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
