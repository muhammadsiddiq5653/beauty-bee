import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beauty Bee — Organic Glow, Every Day",
  description: "Pakistan's favourite organic beauty brand. Lip & Cheek Tints, Skin Whitening Mask, Face Serum & more. Order now with Pakistan-wide delivery via PostEx.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fdf3f9] text-[#1a1a1a]">
        {children}
      </body>
    </html>
  );
}
