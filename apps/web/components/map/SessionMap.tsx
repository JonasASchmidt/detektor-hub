"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { LocateFixedIcon } from "lucide-react";

interface Finding {
  id: string;
  latitude: number;
  longitude: number;
  name: string | null;
}

interface Props {
  findings?: Finding[];
  /** GeoJSON LineString coordinates [[lng, lat], ...] parsed from PostGIS */
  routeCoords?: [number, number][] | null;
  /** Live in-memory GPS points [lat, lng] from useRouteTracker */
  livePoints?: { lat: number; lng: number }[];
  className?: string;
}

/** Fits the map to show all markers + route when data changes. */
function AutoFit({
  findings,
  allLatLngs,
}: {
  findings: Finding[];
  allLatLngs: L.LatLng[];
}) {
  const map = useMap();
  useEffect(() => {
    if (allLatLngs.length === 0) return;
    const bounds = L.latLngBounds(allLatLngs);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findings.length, allLatLngs.length]);
  return null;
}

export default function SessionMap({
  findings = [],
  routeCoords,
  livePoints = [],
  className = "h-64 w-full rounded-lg",
}: Props) {
  // Convert GeoJSON [lng, lat] → Leaflet [lat, lng]
  const storedPolyline: L.LatLngExpression[] =
    routeCoords?.map(([lng, lat]) => [lat, lng]) ?? [];

  // Live tracking points are already [lat, lng]
  const livePolyline: L.LatLngExpression[] = livePoints.map((p) => [p.lat, p.lng]);

  const activePolyline = livePolyline.length >= 2 ? livePolyline : storedPolyline;

  const findingLatLngs = findings.map((f) => L.latLng(f.latitude, f.longitude));
  const routeLatLngs = activePolyline.map((ll) => {
    const a = ll as [number, number];
    return L.latLng(a[0], a[1]);
  });
  const allLatLngs = [...findingLatLngs, ...routeLatLngs];

  const defaultCenter: L.LatLngExpression =
    allLatLngs.length > 0
      ? [allLatLngs[0].lat, allLatLngs[0].lng]
      : [51, 10];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={allLatLngs.length > 0 ? 13 : 6}
      scrollWheelZoom={false}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Stored route */}
      {storedPolyline.length >= 2 && livePolyline.length < 2 && (
        <Polyline positions={storedPolyline} color="#10b981" weight={3} opacity={0.8} />
      )}

      {/* Live route */}
      {livePolyline.length >= 2 && (
        <Polyline positions={livePolyline} color="#f59e0b" weight={3} opacity={0.9} dashArray="6 4" />
      )}

      {/* Finding markers */}
      {findings.map((f) => (
        <Marker
          key={f.id}
          position={[f.latitude, f.longitude]}
          icon={
            <div title={f.name ?? "Fund"}>
              <LocateFixedIcon color="#2d2d2d" size={18} />
            </div>
          }
        />
      ))}

      <AutoFit findings={findings} allLatLngs={allLatLngs} />
    </MapContainer>
  );
}
