"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, LocateFixed, MapPin, Map } from "lucide-react";
import dynamic from "next/dynamic";

const SimpleMap = dynamic(() => import("@/components/map/simple-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[35vh] bg-muted animate-pulse rounded-lg" />
  ),
});

interface LocationFilterProps {
  lat: string;
  lng: string;
  radius: string;
  onApply: (lat: string, lng: string, radius: string) => void;
  onClear: () => void;
  defaultRadius?: string;
  radiusOptions?: { value: string; label: string }[];
}

const defaultRadiusOptions = [
  { value: "1", label: "1 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
];

export function LocationFilter({
  lat,
  lng,
  radius,
  onApply,
  onClear,
  defaultRadius = "25",
  radiusOptions = defaultRadiusOptions,
}: LocationFilterProps) {
  const [locLat, setLocLat] = useState(lat);
  const [locLng, setLocLng] = useState(lng);
  const [locRadius, setLocRadius] = useState(radius || defaultRadius);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const handleApply = () => {
    if (locLat && locLng) {
      onApply(locLat, locLng, locRadius);
    }
  };

  const handleClear = () => {
    setLocLat("");
    setLocLng("");
    setLocRadius(defaultRadius);
    onClear();
  };

  const useCurrentPosition = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude.toFixed(6);
        const newLng = pos.coords.longitude.toFixed(6);
        setLocLat(newLat);
        setLocLng(newLng);
        setGeoLoading(false);
        onApply(newLat, newLng, locRadius);
      },
      () => {
        setGeoLoading(false);
      }
    );
  };

  const handleMapClick = (location: { lat: number; lng: number }) => {
    const newLat = location.lat.toFixed(6);
    const newLng = location.lng.toFixed(6);
    setLocLat(newLat);
    setLocLng(newLng);
  };

  const handleMapConfirm = () => {
    setMapOpen(false);
    if (locLat && locLng) {
      onApply(locLat, locLng, locRadius);
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {lat ? `Umkreis: ${radius || defaultRadius}km` : "Umkreis"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={useCurrentPosition}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LocateFixed className="h-3.5 w-3.5" />
              )}
              Mein Standort
            </Button>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Umkreis</label>
              <Select value={locRadius} onValueChange={setLocRadius}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {radiusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <hr className="border-border" />

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Breitengrad</label>
              <Input
                type="number"
                step="any"
                placeholder="z.B. 51.0504"
                value={locLat}
                onChange={(e) => setLocLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Längengrad</label>
              <Input
                type="number"
                step="any"
                placeholder="z.B. 13.7373"
                value={locLng}
                onChange={(e) => setLocLng(e.target.value)}
              />
            </div>

            <Button size="sm" onClick={handleApply} className="w-full">
              Anwenden
            </Button>

            <hr className="border-border" />

            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setMapOpen(true)}
            >
              <Map className="h-3.5 w-3.5" />
              Standort auswählen
            </Button>

            {lat && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClear}
              >
                Umkreis entfernen
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Standort auswählen</DialogTitle>
          </DialogHeader>
          <SimpleMap
            center={
              locLat && locLng
                ? [parseFloat(locLat), parseFloat(locLng)]
                : undefined
            }
            onClick={handleMapClick}
          />
          <Button onClick={handleMapConfirm} className="w-full" disabled={!locLat || !locLng}>
            Bestätigen
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
