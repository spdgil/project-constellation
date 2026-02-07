"use client";

import { useState, useCallback, useId } from "react";

export interface AccordionSectionProps {
  /** Section heading label — new API uses `title`, legacy API uses `heading` */
  title?: string;
  /** Legacy prop name for `title` */
  heading?: string;
  /** Optional badge content (e.g. "3/5") shown inline with the title */
  badge?: React.ReactNode;

  /* --- Uncontrolled mode (new API) --- */

  /** Whether the section starts expanded (uncontrolled mode) */
  defaultOpen?: boolean;

  /* --- Controlled mode (legacy API used by StateView, LgaDetailPanel) --- */

  /** Controlled expanded state — when provided, the parent owns open/closed */
  expanded?: boolean;
  /** Called when the header is clicked (controlled mode) */
  onToggle?: () => void;
  /** Explicit id for the section (legacy) */
  id?: string;
  /** Explicit id for the content panel (legacy) */
  controlsId?: string;
  /** Heading level for the header (legacy) */
  headingLevel?: "h2" | "h3" | "h4";
  /** Extra className for the content wrapper (legacy) */
  contentClassName?: string;

  children: React.ReactNode;
}

/**
 * Reusable collapsible section following the project design language.
 * Supports both:
 * - **Uncontrolled** (new API): uses `title`, `badge`, `defaultOpen`
 * - **Controlled** (legacy API): uses `heading`, `expanded`, `onToggle`, `controlsId`
 */
export function AccordionSection({
  title,
  heading,
  badge,
  defaultOpen = false,
  expanded: expandedProp,
  onToggle,
  id,
  controlsId,
  headingLevel,
  contentClassName,
  children,
}: AccordionSectionProps) {
  const autoId = useId();

  /* Determine controlled vs uncontrolled */
  const isControlled = expandedProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? expandedProp : internalOpen;

  const handleToggle = useCallback(() => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [isControlled, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const label = title ?? heading ?? "";
  const panelId = controlsId ?? `${autoId}-panel`;
  const headerId = id ? `${id}-header` : `${autoId}-header`;

  /* Heading element */
  const HeadingTag = headingLevel ?? "span";
  const headingContent = (
    <HeadingTag className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
      {label}
    </HeadingTag>
  );

  return (
    <div className="border-t border-[#E8E6E3]">
      <button
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-2 py-4 text-left transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
      >
        <span className="flex items-center gap-2">
          {headingContent}
          {badge != null && (
            typeof badge === "string" || typeof badge === "number" ? (
              <span className="text-[10px] tracking-wider px-1.5 py-0.5 bg-[#F5F3F0] text-[#6B6B6B] border border-[#E8E6E3]">
                {badge}
              </span>
            ) : (
              badge
            )
          )}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#9A9A9A] transition-transform duration-300 ease-out ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className={`pb-4 ${contentClassName ?? ""}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
