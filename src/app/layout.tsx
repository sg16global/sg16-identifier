import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter, SiteHeader, ScrollProgress } from "@/components/ui";
import { WorldAiRail } from "@/components/world-ai-rail";
import { ChatWidget } from "@/components/chat-widget";

export const metadata: Metadata = {
  metadataBase: new URL("https://sg16identifier.com"),
  title: {
    default: "SG16 Identifier — Verify products, news, websites and media with evidence",
    template: "%s · SG16 Identifier",
  },
  description:
    "SG16 Identifier is a free public verification engine for counterfeit products, unverified news claims, scam websites and manipulated media. Every report shows its evidence, sources, confidence and limitations.",
  keywords: [
    "counterfeit check", "fake product checker", "fact check", "scam website checker",
    "image verification", "IMEI check", "barcode check", "phishing check", "SG16 Identifier",
  ],
  openGraph: {
    title: "SG16 Identifier — evidence before conclusion",
    description:
      "One platform for investigating authenticity across products, news, websites and digital media.",
    url: "https://sg16identifier.com",
    siteName: "SG16 Identifier",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23000000'/%3E%3Crect x='4' y='4' width='24' height='24' rx='4' fill='none' stroke='%23ff1744' stroke-width='1.5'/%3E%3Ctext x='16' y='21' font-family='monospace' font-size='12' font-weight='bold' fill='%23ff1744' text-anchor='middle'%3E16%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-screen bg-ink-950 text-mist-200 antialiased">
        <ScrollProgress />
        <SiteHeader />
        <main className="relative">{children}</main>
        <WorldAiRail />
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
