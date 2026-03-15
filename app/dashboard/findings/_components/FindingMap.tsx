"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFindings, UseFindingsParams } from "@/app/_hooks/useFindings";
import { MapContainer, TileLayer } from "react-leaflet";
import ClickHandler from "@/components/map/click-handler";
import * as LucideIcons from "lucide-react";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Props {
  filters: {
    search: string;
    sort: string;
  };
}

interface HoverState {
  finding: FindingWithRelations;
  x: number;
  y: number;
}

function MiniCard({ finding }: { finding: FindingWithRelations }) {
  const displayImage =
    finding.images?.find((img) => img.id === finding.thumbnailId) ||
    finding.images?.[0];
  const formattedDate = format(new Date(finding.createdAt), "d. MMM yyyy", { locale: de });

  return (
    <div className="bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden w-56 pointer-events-none select-none">
      {displayImage && (
        <div className="w-full h-28 overflow-hidden">
          <CldImage
            src={displayImage.publicId}
            width={224}
            height={112}
            crop="fill"
            gravity="auto"
            alt={finding.name || ""}
            format="auto"
            quality="auto"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-bold text-sm leading-tight line-clamp-1">
          {finding.name}
        </h3>
        <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
        {finding.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {finding.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 pl-2 pr-2 py-px rounded uppercase text-[11px] font-semibold tracking-wide text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const center = [53, 9];

export default function FindingMap({ filters }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  const queryParams = useMemo(
    () => ({ search: filters.search, tag: "" } as UseFindingsParams),
    [filters.search]
  );

  const { findings } = useFindings(queryParams);

  const getIcon = (iconName: string): LucideIcons.LucideIcon | null => {
    const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    return (LucideIcons[pascalName as keyof typeof LucideIcons] as LucideIcons.LucideIcon) || null;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverState) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoverState((prev) =>
      prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null
    );
  }, [hoverState]);

  const renderMarker = (finding: FindingWithRelations) => {
    if (!finding.latitude || !finding.longitude) return null;
    const firstTag = finding.tags.length > 0 ? finding.tags[0] : null;
    const IconComponent = firstTag ? getIcon(firstTag.icon) : null;
    const color = firstTag?.color ?? "#2d2d2d";
    const FallbackIcon = LucideIcons.LocateFixed;

    return (
      <Marker
        key={`finding_marker_${finding.id}`}
        position={[finding.latitude, finding.longitude]}
        icon={
          <div
            className="cursor-pointer"
            onMouseEnter={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              setHoverState({
                finding,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }}
            onMouseLeave={() => setHoverState(null)}
            onClick={() => router.push(`/dashboard/findings/${finding.id}`)}
          >
            {IconComponent ? (
              <IconComponent color={color} size={20} />
            ) : (
              <FallbackIcon color={color} size={20} />
            )}
          </div>
        }
      />
    );
  };

  // Position the card above-right of cursor, flip left if near right edge
  const cardStyle = (() => {
    if (!hoverState || !containerRef.current) return undefined;
    const { x, y } = hoverState;
    const containerW = containerRef.current.offsetWidth;
    const cardW = 224; // w-56
    const offsetX = 16;
    const offsetY = 24;
    const flipLeft = x + cardW + offsetX > containerW;
    return {
      position: "absolute" as const,
      left: flipLeft ? x - cardW - offsetX : x + offsetX,
      top: y - offsetY,
      zIndex: 1000,
      pointerEvents: "none" as const,
    };
  })();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
    >
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
        <ClickHandler onClick={() => {}} />
        {findings.map((finding) => renderMarker(finding))}
      </MapContainer>

      {hoverState && cardStyle && (
        <div style={cardStyle}>
          <MiniCard finding={hoverState.finding} />
        </div>
      )}
    </div>
  );
}
