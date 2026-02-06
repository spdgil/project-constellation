"use client";

/**
 * Reusable accessible accordion section — used by LgaDetailPanel and StateView.
 */

export interface AccordionSectionProps {
  id: string;
  heading: string;
  expanded: boolean;
  onToggle: () => void;
  controlsId: string;
  /** Heading level: "h2" for top-level sections, "h3" for nested panels */
  headingLevel?: "h2" | "h3";
  /** Padding class for the collapsible content area */
  contentClassName?: string;
  children: React.ReactNode;
}

export function AccordionSection({
  id,
  heading,
  expanded,
  onToggle,
  controlsId,
  headingLevel = "h3",
  contentClassName = "pb-3",
  children,
}: AccordionSectionProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  const HeadingTag = headingLevel;
  const headingClasses =
    headingLevel === "h2"
      ? "font-heading text-lg font-normal leading-[1.4] text-[#2C2C2C]"
      : "font-heading text-sm font-normal leading-[1.4] text-[#2C2C2C]";
  const buttonPadding = headingLevel === "h2" ? "py-4 px-4" : "py-2";

  return (
    <div
      className="border-b border-[#F0EEEB] last:border-b-0"
      data-accordion-section={id}
    >
      <HeadingTag className={headingClasses}>
        <button
          type="button"
          id={controlsId}
          aria-expanded={expanded}
          aria-controls={`${controlsId}-content`}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between gap-2 ${buttonPadding} text-left border-0 bg-transparent text-sm text-[#2C2C2C] hover:bg-[#F5F3F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out`}
        >
          {heading}
          <span className="text-[#6B6B6B] text-xs" aria-hidden>
            {expanded ? "−" : "+"}
          </span>
        </button>
      </HeadingTag>
      <div
        id={`${controlsId}-content`}
        role="region"
        aria-labelledby={controlsId}
        hidden={!expanded}
        className={expanded ? contentClassName : "hidden"}
      >
        {children}
      </div>
    </div>
  );
}
