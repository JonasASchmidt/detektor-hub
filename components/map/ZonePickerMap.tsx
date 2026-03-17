"use client";

import L from "leaflet";
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from "react-leaflet";

interface Props {
  /** Leaflet-order [lat, lng] pairs */
  value?: [number, number][];
  onChange: (coords: [number, number][] | null) => void;
}

function DrawHandler({ onAdd }: { onAdd: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng);
    },
  });
  return null;
}

export default function ZonePickerMap({ value, onChange }: Props) {
  const positions = value ?? [];

  return (
    <div className="flex flex-col gap-2">
      <MapContainer
        center={[51.0504, 13.7373]}
        zoom={6}
        scrollWheelZoom={true}
        className="h-[300px] rounded-lg cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawHandler onAdd={(latlng) => onChange([...positions, [latlng.lat, latlng.lng]])} />
        {positions.length >= 3 && (
          <Polygon
            positions={positions}
            pathOptions={{ color: "#2d2d2d", fillColor: "#2d2d2d", fillOpacity: 0.15, weight: 2 }}
          />
        )}
        {positions.length >= 2 && positions.length < 3 && (
          <Polygon
            positions={positions}
            pathOptions={{ color: "#2d2d2d", fillOpacity: 0, weight: 2, dashArray: "6 4" }}
          />
        )}
        {positions.map(([lat, lng], i) => (
          <CircleMarker
            key={i}
            center={[lat, lng]}
            radius={5}
            pathOptions={{ color: "#2d2d2d", fillColor: "#fff", fillOpacity: 1, weight: 2 }}
          />
        ))}
      </MapContainer>

      <div className="flex items-center justify-between text-sm">
        {positions.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            Klicke auf die Karte um die Zone zu zeichnen (mind. 3 Punkte)
          </span>
        ) : positions.length < 3 ? (
          <span className="text-muted-foreground text-xs">
            {positions.length} Punkt{positions.length !== 1 ? "e" : ""} gesetzt — noch {3 - positions.length} weitere benötigt
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {positions.length} Punkte — Polygon vollständig
          </span>
        )}
        {positions.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-destructive hover:underline"
          >
            Zone löschen
          </button>
        )}
      </div>
    </div>
  );
}
