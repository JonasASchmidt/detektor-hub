"use client";

import dynamic from "next/dynamic";

const SessionMap = dynamic(() => import("@/components/map/session-map"), { ssr: false });

interface Finding {
  id: string;
  latitude: number;
  longitude: number;
  name: string | null;
}

interface Props {
  findings: Finding[];
  routeCoords: [number, number][] | null;
}

export default function SessionDetailMap({ findings, routeCoords }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border">
      <SessionMap
        findings={findings}
        routeCoords={routeCoords}
        className="h-80 w-full"
      />
    </div>
  );
}
