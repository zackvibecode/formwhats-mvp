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

export const metadata: Metadata = {
  title: "FormWhats",
  description:
    "Create simple forms that turn customer answers into WhatsApp-ready leads.",
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
