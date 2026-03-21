"use client";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";

// Fits the map viewport to the polygon bounds after mount
function BoundsController({ geojson }: { geojson: GeoJsonObject }) {
  const map = useMap();
  useEffect(() => {
    try {
      const bounds = L.geoJSON(geojson).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] });
    } catch {
      // ignore invalid geometry
    }
  }, [map, geojson]);
  return null;
}

interface Props {
  geojson: GeoJsonObject;
}

export default function AdminUnitMap({ geojson }: Props) {
  return (
    <MapContainer
      center={[51.5, 10.5]} // Germany center — overridden by BoundsController
      zoom={6}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      doubleClickZoom={false}
      className="w-full h-full rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <GeoJSON
        data={geojson}
        style={{
          color: "#2d2d2d",
          weight: 2,
          fillOpacity: 0.12,
          fillColor: "#2d2d2d",
        }}
      />
      <BoundsController geojson={geojson} />
    </MapContainer>
  );
}
