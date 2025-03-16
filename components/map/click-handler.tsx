"use client";

import L from "leaflet";
import { Pane, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  onClick?: (location: L.LatLng) => void;
}

const ClickHandler: React.FC<MapProps> = ({ onClick }) => {
  const map = useMapEvents({
    click(e) {
      onClick?.(e.latlng);
    },
  });

  return <Pane name="clickHandler" />;
};

export default ClickHandler;
