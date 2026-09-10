import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free YouTube Transcript Generator",
  description: "Paste a YouTube link, get the transcript instantly. No sign-up.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-neutral-950 text-neutral-100 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
