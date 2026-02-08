"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/lga", label: "LGAs" },
  { href: "/sectors", label: "Sectors" },
  { href: "/deals", label: "Deals" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header
      className="border-b bg-[#FAF9F7] border-[#E8E6E3]"
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        {/* Top bar: logo + app name + user */}
        <div className="pt-3 pb-1 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/CDF-logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="font-heading text-2xl text-[#2C2C2C]">
              The Constellation Development Facility
            </span>
          </Link>

          {session?.user && (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-sm text-[#6B6B6B] hidden sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="text-xs text-[#9A9A9A] hover:text-[#2C2C2C] transition duration-200"
              >
                Sign out
              </button>
            </div>
          )}
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
