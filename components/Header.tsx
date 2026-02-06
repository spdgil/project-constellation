"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/deals", label: "Deals" },
  { href: "/state", label: "State" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="border-b bg-[#FAF9F7] border-[#E8E6E3]"
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center gap-8 h-14">
        <Link
          href="/"
          className="font-heading text-xl text-[#2C2C2C] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition-[box-shadow] duration-200 ease-out"
        >
          Project Constellation
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
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
                  text-sm px-3 py-1.5
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
