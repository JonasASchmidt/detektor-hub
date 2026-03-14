"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { NEW_ZONE_VALUE, type ZoneOption } from "./useZonePicker";

const ZonePickerMap = dynamic(() => import("@/components/map/zone-picker-map"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted animate-pulse rounded-lg" />,
});

interface Props {
  zones: ZoneOption[];
  selectedZoneId: string;
  isDrawingNewZone: boolean;
  newZoneName: string;
  newZoneCoords: [number, number][] | null;
  onSelectChange: (value: string) => void;
  onNewZoneNameChange: (name: string) => void;
  onNewZoneCoordsChange: (coords: [number, number][] | null) => void;
}

export default function ZonePicker({
  zones,
  selectedZoneId,
  isDrawingNewZone,
  newZoneName,
  newZoneCoords,
  onSelectChange,
  onNewZoneNameChange,
  onNewZoneCoordsChange,
}: Props) {
  return (
    <Card className="bg-white dark:bg-gray-900 border border-border">
      <div className="py-4 px-6 space-y-3">
        <div>
          <p className="text-xl font-bold">Suchzone</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Wähle eine bestehende Zone oder zeichne eine neue.
          </p>
        </div>

        <select
          value={selectedZoneId}
          onChange={(e) => onSelectChange(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— keine Zone —</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
          <option value={NEW_ZONE_VALUE}>+ Neue Zone erstellen …</option>
        </select>

        {isDrawingNewZone && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newZoneName">Name der neuen Zone</Label>
              <Input
                id="newZoneName"
                placeholder="z. B. Feld Müller"
                value={newZoneName}
                onChange={(e) => onNewZoneNameChange(e.target.value)}
              />
            </div>
            <ZonePickerMap
              value={newZoneCoords ?? undefined}
              onChange={onNewZoneCoordsChange}
            />
          </div>
        )}

        {selectedZoneId && !isDrawingNewZone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Plus className="w-3.5 h-3.5 rotate-45 opacity-50" />
            <span>
              Zone kann unter{" "}
              <a href="/dashboard/zones" className="underline hover:text-foreground">
                Zonen
              </a>{" "}
              bearbeitet werden.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
