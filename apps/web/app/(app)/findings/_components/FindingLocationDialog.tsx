"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type CoordinateSystem, COORDINATE_SYSTEM_LABELS, formatCoordinates } from "@/lib/coordinates";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-lg" />,
});

interface Props {
  open: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  county?: string | null;
  name?: string | null;
}

export default function FindingLocationDialog({ open, onClose, latitude, longitude, county, name }: Props) {
  const [crs, setCrs] = useState<CoordinateSystem>("WGS84");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-bold">{name ?? "Fundort"}</DialogTitle>
        </DialogHeader>
        <div className="h-[300px]">
          <FindingDetailMap latitude={latitude} longitude={longitude} />
        </div>
        <div className="px-5 py-3 flex flex-col gap-2">
          {/* CRS selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground shrink-0">Koordinatensystem</span>
            <Select value={crs} onValueChange={(v) => setCrs(v as CoordinateSystem)}>
              <SelectTrigger className="h-7 text-xs w-auto min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(COORDINATE_SYSTEM_LABELS) as [CoordinateSystem, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coordinate display */}
          <div className="text-sm text-muted-foreground flex items-center gap-3">
            <span className="font-mono text-xs">{formatCoordinates(latitude, longitude, crs)}</span>
            {county && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>{county}</span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
