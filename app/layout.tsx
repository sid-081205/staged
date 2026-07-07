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
    default: "Staged | Virtual staging for real estate listings",
    template: "%s | Staged",
  },
  description:
    "Upload photos of empty rooms. Download them professionally furnished minutes later. $1 per image, no subscription. Stage for sale listings or Airbnb, remove furniture, or fix the lighting.",
  openGraph: {
    title: "Staged | Empty rooms don't sell",
    description:
      "AI virtual staging for real estate listings and Airbnbs. $1 per image, renders in minutes, free previews.",
    images: ["/demo/after.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Staged | Empty rooms don't sell",
    description: "AI virtual staging for real estate listings and Airbnbs. $1 per image, free previews.",
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
