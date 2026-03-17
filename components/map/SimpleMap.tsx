"use client";

import L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import ClickHandler from "./ClickHandler";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { LocateFixedIcon } from "lucide-react";

interface Props {
  center?: number[];
  onClick?: (location: L.LatLng) => void;
}

export default function SimpleMap({ center, onClick }: Props) {
  return (
    <MapContainer
      center={(center as L.LatLngExpression) || [51, 13]}
      zoom={center ? 4 : 2}
      scrollWheelZoom={false}
      className="h-[35vh] rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onClick} />
      {center && (
        <Marker
          position={center as L.LatLngExpression}
          icon={<LocateFixedIcon />}
        />
      )}
    </MapContainer>
  );
}
