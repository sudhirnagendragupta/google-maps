"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

export function MapProvider({
  children,
  apiKey,
}: {
  children: React.ReactNode;
  apiKey: string;
}) {
  return (
    <APIProvider apiKey={apiKey} onLoad={() => console.log('Maps API has loaded.')}>
      {children}
    </APIProvider>
  );
}
