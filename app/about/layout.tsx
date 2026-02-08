import { AboutTabBar } from "@/components/about/AboutTabBar";

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-6">
      <AboutTabBar />
      {children}
    </div>
  );
}
