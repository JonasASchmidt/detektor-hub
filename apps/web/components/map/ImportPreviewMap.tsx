"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { MapPinIcon } from "lucide-react";

interface ImportFinding {
  _id: string;
  lat: number;
  lng: number;
  name?: string;
}

interface Props {
  findings: ImportFinding[];
  selectedIds: Set<string>;
  /** GPX track coordinates in GeoJSON order [lng, lat] */
  routeCoordinates?: [number, number][];
  onToggleFinding?: (id: string) => void;
  className?: string;
}

/** Auto-fits map bounds to all visible features. */
function AutoFit({ latLngs }: { latLngs: L.LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (latLngs.length === 0) return;
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    // Re-fit only when the number of points changes (e.g. new file loaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latLngs.length]);
  return null;
}

export default function ImportPreviewMap({
  findings,
  selectedIds,
  routeCoordinates,
  onToggleFinding,
  className = "h-64 w-full rounded-xl",
}: Props) {
  // Convert GeoJSON [lng, lat] → Leaflet [lat, lng] for Polyline
  const polyline: L.LatLngExpression[] =
    routeCoordinates?.map(([lng, lat]) => [lat, lng]) ?? [];

  // Collect all points for auto-fit
  const allLatLngs: L.LatLng[] = [
    ...findings.map((f) => L.latLng(f.lat, f.lng)),
    ...polyline.map((ll) => {
      const a = ll as [number, number];
      return L.latLng(a[0], a[1]);
    }),
  ];

  const defaultCenter: L.LatLngExpression =
    allLatLngs.length > 0 ? [allLatLngs[0].lat, allLatLngs[0].lng] : [51, 10];

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

      {/* GPX track */}
      {polyline.length >= 2 && (
        <Polyline positions={polyline} color="#2d2d2d" weight={3} opacity={0.7} />
      )}

      {/* Finding markers — selected: solid, deselected: faded */}
      {findings.map((f) => {
        const selected = selectedIds.has(f._id);
        return (
          <Marker
            key={f._id}
            position={[f.lat, f.lng]}
            eventHandlers={
              onToggleFinding ? { click: () => onToggleFinding(f._id) } : {}
            }
            icon={
              <div
                title={f.name ?? "Fund"}
                style={{ opacity: selected ? 1 : 0.3, cursor: onToggleFinding ? "pointer" : "default" }}
              >
                <MapPinIcon
                  size={20}
                  color={selected ? "#2d2d2d" : "#6b7280"}
                  fill={selected ? "#2d2d2d" : "none"}
                />
              </div>
            }
          />
        );
      })}

      <AutoFit latLngs={allLatLngs} />
    </MapContainer>
  );
}
