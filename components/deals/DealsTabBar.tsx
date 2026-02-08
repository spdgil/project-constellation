"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/deals/list", label: "Deals" },
  { href: "/deals/analysis", label: "Analysis" },
  { href: "/deals/pathway", label: "Deal Pathway" },
  { href: "/deals/memo", label: "New Deal" },
] as const;

/**
 * Chip/pill navigation for the /deals section.
 * Visually distinct from the global underlined-tab nav in Header.
 */
export function DealsTabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Deal views" className="flex flex-wrap gap-2">
      {TABS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`
              text-sm rounded-full px-3.5 py-1.5
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]
              transition duration-200 ease-out
              ${
                isActive
                  ? "bg-[#2C2C2C] text-white font-medium"
                  : "border border-[#E8E6E3] text-[#6B6B6B] hover:border-[#C8C4BF] hover:text-[#2C2C2C]"
              }
            `}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
