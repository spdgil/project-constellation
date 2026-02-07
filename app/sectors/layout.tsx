import Link from "next/link";
import { SectorsTabBar } from "@/components/sectors/SectorsTabBar";

export default function SectorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
            Sector Opportunities
          </h1>
          <p className="mt-1 text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
            Seven priority sectors identified for METS diversification, based on
            adjacency to existing skills, government priority, and growth
            trajectory.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>
      <SectorsTabBar />
      {children}
    </div>
  );
}
