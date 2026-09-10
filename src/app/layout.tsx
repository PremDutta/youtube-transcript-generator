import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Free YouTube Transcript Generator",
  description: "Paste a YouTube link, get the transcript instantly. No sign-up.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-neutral-950 font-sans text-neutral-100 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
