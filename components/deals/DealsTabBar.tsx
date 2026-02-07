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
 * Sub-tab navigation for the /deals section.
 * Renders two tabs: Deals (search/list) and Deal Pathway (process overview).
 */
export function DealsTabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Deal views" role="tablist" className="flex gap-1 border-b border-[#E8E6E3]">
      {TABS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={`
              text-sm px-4 py-2.5
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]
              transition duration-200 ease-out
              ${
                isActive
                  ? "text-[#2C2C2C] border-b-2 border-[#2C2C2C] font-medium"
                  : "text-[#6B6B6B] border-b-2 border-transparent hover:text-[#2C2C2C] hover:border-[#C8C4BF]"
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
