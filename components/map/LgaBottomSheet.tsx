"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { LGA, Deal } from "@/lib/types";
import { LgaDetailPanel } from "./LgaDetailPanel";

/* ------------------------------------------------------------------ */
/* Snap-point heights (fractions of the container)                     */
/* ------------------------------------------------------------------ */
type SnapPoint = "peek" | "half" | "full";
const SNAP_FRACTIONS: Record<SnapPoint, number> = {
  peek: 0.12,
  half: 0.45,
  full: 0.85,
};
const PEEK_MIN_PX = 64;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export interface LgaBottomSheetProps {
  lga: LGA;
  deals: Deal[];
  onClose: () => void;
}

export function LgaBottomSheet({ lga, deals, onClose }: LgaBottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<SnapPoint>("half");
  const [dragging, setDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const startY = useRef(0);
  const startH = useRef(0);

  /* Total container height (parent flex column) for fraction calculations */
  const [containerH, setContainerH] = useState(600);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerH(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snapHeight = (sp: SnapPoint) =>
    Math.max(containerH * SNAP_FRACTIONS[sp], sp === "peek" ? PEEK_MIN_PX : 0);

  const currentHeight = dragHeight ?? snapHeight(snap);

  /* ---- pointer drag on the handle -------------------------------- */
  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      startY.current = e.clientY;
      startH.current = currentHeight;
    },
    [currentHeight],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const dy = startY.current - e.clientY; // up = positive
      const newH = clamp(
        startH.current + dy,
        snapHeight("peek"),
        snapHeight("full"),
      );
      setDragHeight(newH);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, containerH],
  );

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const h = dragHeight ?? snapHeight(snap);
    /* Snap to nearest */
    const distances: [SnapPoint, number][] = (
      Object.entries(SNAP_FRACTIONS) as [SnapPoint, number][]
    ).map(([sp]) => [sp, Math.abs(h - snapHeight(sp))]);
    distances.sort((a, b) => a[1] - b[1]);
    setSnap(distances[0][0]);
    setDragHeight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, dragHeight, containerH, snap]);

  /* ---- keyboard controls ----------------------------------------- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSnap((prev) =>
          prev === "peek" ? "half" : prev === "half" ? "full" : "full",
        );
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSnap((prev) =>
          prev === "full" ? "half" : prev === "half" ? "peek" : "peek",
        );
      }
    },
    [],
  );

  /* Reset to half when LGA changes */
  useEffect(() => {
    setSnap("half");
    setDragHeight(null);
  }, [lga.id]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`${lga.name} LGA details`}
      data-bottom-sheet
      className="shrink-0 flex flex-col bg-[#FAF9F7] border-t border-[#E8E6E3] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{
        height: currentHeight,
        transition: dragging ? "none" : "height 300ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ---- Drag handle ----------------------------------------- */}
      <div
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-valuenow={Math.round((currentHeight / containerH) * 100)}
        aria-valuemin={Math.round(SNAP_FRACTIONS.peek * 100)}
        aria-valuemax={Math.round(SNAP_FRACTIONS.full * 100)}
        aria-label="Resize LGA detail panel"
        className="flex items-center justify-center py-2 cursor-ns-resize shrink-0 select-none touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-inset"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className="w-10 h-1 rounded-full bg-[#C4BDB4]" />
      </div>

      {/* ---- Header row ------------------------------------------ */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2 shrink-0">
        <h2 className="font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C] truncate">
          {lga.name}
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          {/* Snap-size buttons */}
          <div className="flex items-center gap-1 text-xs text-[#9A9A9A]">
            {(["peek", "half", "full"] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => { setSnap(sp); setDragHeight(null); }}
                className={`px-1.5 py-0.5 rounded transition-colors duration-200 ${
                  snap === sp && !dragging
                    ? "bg-[#E8E6E3] text-[#2C2C2C]"
                    : "hover:bg-[#F5F3F0]"
                }`}
                aria-label={`Resize to ${sp}`}
              >
                {sp === "peek" ? "—" : sp === "half" ? "½" : "▣"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close LGA panel"
            className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            Close
          </button>
        </div>
      </div>

      {/* ---- Scrollable content ---------------------------------- */}
      <div className="flex-1 overflow-auto min-h-0">
        <LgaDetailPanel lga={lga} deals={deals} onClose={onClose} />
      </div>
    </div>
  );
}
