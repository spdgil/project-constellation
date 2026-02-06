import { DealsTabBar } from "@/components/deals/DealsTabBar";

export default function DealsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6">
      <DealsTabBar />
      {children}
    </div>
  );
}
