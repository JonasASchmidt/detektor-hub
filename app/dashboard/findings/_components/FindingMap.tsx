"use client";

import { useMemo } from "react";
import { useFindings, UseFindingsParams } from "@/app/_hooks/useFindings";
import { MapContainer, TileLayer } from "react-leaflet";
import ClickHandler from "@/components/map/click-handler";
import * as LucideIcons from "lucide-react";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";

interface Props {
  filters: {
    search: string;
    sort: string;
  };
}

const center = [53, 9];

export default function FindingsList({ filters }: Props) {
  const queryParams = useMemo(
    () =>
      ({
        search: filters.search,
        tag: "",
      } as UseFindingsParams),
    [filters.search]
  );

  const { findings, total: _total, loading: _loading, error: _error } = useFindings(queryParams);

  const onClick = () => {};

  const renderMarker = (finding: FindingWithRelations) => {
    const firstTag = finding.tags.length > 0 ? finding.tags[0] : null;

    if (!firstTag) {
      return (
        <Marker
          key={`finding_marker_${finding.id}`}
          position={[finding.latitude, finding.longitude]}
          icon={LucideIcons["LocateFixedIcon"]}
        />
      );
    }

    const IconComponent = LucideIcons[
      firstTag.icon as keyof typeof LucideIcons
    ] as LucideIcons.LucideIcon;
    const color = firstTag.color ?? "#000";

    return (
      <Marker
        key={`finding_marker_${finding.id}`}
        position={[finding.latitude, finding.longitude]}
        icon={<IconComponent color={color} size={20} />}
      />
    );
  };

  return (
    <MapContainer
      center={(center as L.LatLngExpression) || [51, 13]}
      zoom={center ? 4 : 2}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onClick} />
      {findings.map((finding) => renderMarker(finding))}
    </MapContainer>
  );
}
