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

  const getIcon = (iconName: string): LucideIcons.LucideIcon | null => {
    const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    return (LucideIcons[pascalName as keyof typeof LucideIcons] as LucideIcons.LucideIcon) || null;
  };

  const renderMarker = (finding: FindingWithRelations) => {
    const firstTag = finding.tags.length > 0 ? finding.tags[0] : null;
    const IconComponent = firstTag ? getIcon(firstTag.icon) : null;
    const color = firstTag?.color ?? "#2d2d2d";
    const FallbackIcon = LucideIcons.LocateFixed;

    return (
      <Marker
        key={`finding_marker_${finding.id}`}
        position={[finding.latitude, finding.longitude]}
        icon={IconComponent ? <IconComponent color={color} size={20} /> : <FallbackIcon size={20} />}
      />
    );
  };

  return (
    <MapContainer
      center={(center as L.LatLngExpression) || [51, 13]}
      zoom={center ? 4 : 2}
      scrollWheelZoom={false}
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
