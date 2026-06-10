import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MapProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Journey Planner",
  description: "An agentic travel planner using Google Maps Grounding Lite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We use the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for the Maps React SDK
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <html lang="en">
      <body className={inter.className}>
        <MapProvider apiKey={apiKey}>
          {children}
        </MapProvider>
      </body>
    </html>
  );
}
