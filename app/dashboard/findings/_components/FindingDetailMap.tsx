"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { LocateFixedIcon } from "lucide-react";

interface Props {
  latitude: number;
  longitude: number;
}

export default function FindingDetailMap({ latitude, longitude }: Props) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="w-full h-full rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker
        position={[latitude, longitude]}
        icon={<LocateFixedIcon />}
      />
    </MapContainer>
  );
}
