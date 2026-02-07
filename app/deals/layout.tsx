import Link from "next/link";
import { DealsTabBar } from "@/components/deals/DealsTabBar";

export default function DealsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
          Active deals across all sector opportunities, tracked through the
          investment pathway from definition to transaction close.
        </p>
        <Link
          href="/"
          className="shrink-0 text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to home
        </Link>
      </div>
      <DealsTabBar />
      {children}
    </div>
  );
}
