"use client";

import { useEffect, useMemo, useState } from "react";
import { fromGeoJSON, toGeoJSON } from "@/lib/geo";
import { toast } from "sonner";

export const NEW_ZONE_VALUE = "__new__";

export interface ZoneOption {
  id: string;
  name: string;
  geometryGeoJson: string | null;
}

export function useZonePicker(initialZoneId?: string | null) {
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId ?? "");
  const [newZoneCoords, setNewZoneCoords] = useState<[number, number][] | null>(null);
  const [newZoneName, setNewZoneName] = useState("");

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((data) => setZones(data.zones ?? []));
  }, []);

  const isDrawingNewZone = selectedZoneId === NEW_ZONE_VALUE;

  /** Polygon coords of the currently selected/drawn zone, for findings filtering. */
  const activeZoneCoords = useMemo<[number, number][] | null>(() => {
    if (isDrawingNewZone) return newZoneCoords;
    const zone = zones.find((z) => z.id === selectedZoneId);
    if (!zone?.geometryGeoJson) return null;
    return fromGeoJSON(zone.geometryGeoJson);
  }, [isDrawingNewZone, newZoneCoords, zones, selectedZoneId]);

  const handleSelectChange = (value: string) => {
    setSelectedZoneId(value);
    setNewZoneCoords(null);
    setNewZoneName("");
  };

  /**
   * Call during form submit. Creates a new zone if in drawing mode.
   * Returns the resolved zoneId (or null for no zone).
   * Throws if validation fails so the caller can abort the submit.
   */
  async function resolveZoneId(): Promise<string | null> {
    if (!isDrawingNewZone) return selectedZoneId || null;

    if (!newZoneName.trim()) {
      toast.error("Bitte gib der neuen Zone einen Namen.");
      throw new Error("missing_zone_name");
    }

    const geometry =
      newZoneCoords && newZoneCoords.length >= 3 ? toGeoJSON(newZoneCoords) : null;

    const res = await fetch("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newZoneName, geometry }),
    });

    if (!res.ok) {
      toast.error("Zone konnte nicht erstellt werden.");
      throw new Error("zone_create_failed");
    }

    const { zone } = await res.json();
    return zone.id;
  }

  return {
    zones,
    selectedZoneId,
    isDrawingNewZone,
    newZoneName,
    newZoneCoords,
    activeZoneCoords,
    setNewZoneName,
    setNewZoneCoords,
    handleSelectChange,
    resolveZoneId,
  };
}
