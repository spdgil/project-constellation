import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SessionWrapper } from "@/components/SessionWrapper";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "The Constellation Development Facility",
  description:
    "Queensland state-level dashboard: opportunity patterns by LGA, deal pipeline, project development facility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={newsreader.variable}>
      <body className="min-h-screen flex flex-col bg-[#FAF9F7] text-[#2C2C2C] antialiased">
        <SessionWrapper>
          <a
            href="#main-content"
            className="skip-link"
            data-testid="skip-to-content"
          >
            Skip to main content
          </a>
          <Header />
          <main
            id="main-content"
            className="flex-1 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 py-8"
            tabIndex={-1}
          >
            {children}
          </main>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
