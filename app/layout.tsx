import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import RenderTracker from "@/components/RenderTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Staged — virtual staging for real estate listings",
    template: "%s — Staged",
  },
  description:
    "Upload photos of empty rooms. Download them professionally furnished in about 30 seconds. $19 per listing, no subscription. Includes declutter and photo-enhancement modes.",
  openGraph: {
    title: "Staged — empty rooms don't sell",
    description:
      "AI virtual staging for real estate listings. $19 per listing, renders in 30 seconds, free previews.",
    images: ["/demo/after.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Staged — empty rooms don't sell",
    description: "AI virtual staging for real estate listings. $19 per listing, free previews.",
    images: ["/demo/after.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body>
        {children}
        <RenderTracker />
      </body>
    </html>
  );
}
