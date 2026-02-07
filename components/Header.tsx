"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/lga", label: "LGAs" },
  { href: "/sectors", label: "Sectors" },
  { href: "/deals", label: "Deals" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="border-b bg-[#FAF9F7] border-[#E8E6E3]"
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        {/* App name — static identity label above the tabs */}
        <div className="pt-3 pb-1">
          <span className="font-heading text-2xl text-[#2C2C2C]">
            The Constellation Development Facility
          </span>
        </div>

        {/* Navigation tabs */}
        <nav aria-label="Main" className="flex items-center gap-1 -mb-px">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  text-sm px-3 py-2
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
      </div>
    </header>
  );
}
