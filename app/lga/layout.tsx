import { LgaTabBar } from "@/components/lga/LgaTabBar";

export default function LgaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6">
      <LgaTabBar />
      {children}
    </div>
  );
}
