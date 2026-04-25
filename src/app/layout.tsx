import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beauty Bee — Lip & Cheek Tint",
  description: "Pakistan's favourite organic beauty brand. Lip & Cheek Tint in 6 stunning shades. Cash on delivery, Pakistan-wide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} min-h-screen bg-[#FAF7F4] text-[#1a1a1a] font-sans`}>
        {children}
      </body>
    </html>
  );
}
