import type { Metadata } from "next";
import "./globals.css";
import { CircuitProvider } from "@/components/layout/CircuitProvider";

export const metadata: Metadata = {
  title: "AceLens — Tennis Predictions & Previews",
  description:
    "AI-powered match previews, surface-adjusted Elo predictions, and tournament insights for ATP and WTA tennis.",
  openGraph: {
    title: "AceLens",
    description: "Tennis predictions for fans who want the story, not just the stats.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900 flex flex-col">
        <CircuitProvider>{children}</CircuitProvider>
      </body>
    </html>
  );
}
