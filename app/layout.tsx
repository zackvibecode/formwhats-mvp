import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import SiteHeader from "@/components/site-header";
import "./globals.css";

// Montserrat as the brand typeface. Loaded via next/font with display=swap
// so the rest of the app keeps rendering even if Google fonts is slow.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

// Used to resolve relative URLs in OpenGraph/Twitter metadata. Falls back
// to localhost in dev. Set NEXT_PUBLIC_SITE_URL on Vercel to your prod URL
// (e.g. https://formwhats-mvp.vercel.app) for correct social previews.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "FormWhats — WhatsApp form builder",
  description:
    "Create simple forms that turn customer answers into WhatsApp-ready leads.",
  icons: {
    // Next.js 14 also auto-detects app/icon.png and app/apple-icon.png,
    // but we list them explicitly here so older crawlers and link
    // unfurlers (Twitter, FB, LinkedIn) pick them up consistently.
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "FormWhats — WhatsApp form builder",
    description:
      "Create simple forms that turn customer answers into WhatsApp-ready leads.",
    images: ["/icon.png"],
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-screen bg-white font-sans text-black antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
