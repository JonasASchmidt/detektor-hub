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

const SimpleMap = dynamic(() => import("@/components/map/SimpleMap"), {
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
  const [open, setOpen] = useState(false);
  const [locLat, setLocLat] = useState(lat);
  const [locLng, setLocLng] = useState(lng);
  const [locRadius, setLocRadius] = useState(radius || defaultRadius);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const applyAndClose = (newLat: string, newLng: string, newRadius: string) => {
    onApply(newLat, newLng, newRadius);
    setOpen(false);
  };

  const handleClear = () => {
    setLocLat("");
    setLocLng("");
    setLocRadius(defaultRadius);
    onClear();
    setOpen(false);
  };

  const handleRadiusChange = (value: string) => {
    setLocRadius(value);
    if (locLat && locLng) {
      applyAndClose(locLat, locLng, value);
    }
  };

  const handleCoordBlur = () => {
    if (locLat && locLng) {
      applyAndClose(locLat, locLng, locRadius);
    }
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
        applyAndClose(newLat, newLng, locRadius);
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
      applyAndClose(locLat, locLng, locRadius);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-1 shrink-0 whitespace-nowrap ${lat ? "" : "text-muted-foreground"}`}>
            <MapPin className="h-3.5 w-3.5" />
            Umkreis
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64"
          align="start"
          collisionPadding={8}
        >
          <div className="space-y-2 p-1">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={useCurrentPosition}
                disabled={geoLoading}
              >
                {geoLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="h-3.5 w-3.5" />
                )}
                Standort
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => setMapOpen(true)}
              >
                <Map className="h-3.5 w-3.5" />
                Karte
              </Button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Umkreis</label>
              <Select value={locRadius} onValueChange={handleRadiusChange}>
                <SelectTrigger className="mt-1">
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

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Breite</label>
                <Input
                  className="mt-1"
                  type="number"
                  step="any"
                  placeholder="51.0504"
                  value={locLat}
                  onChange={(e) => setLocLat(e.target.value)}
                  onBlur={handleCoordBlur}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Länge</label>
                <Input
                  className="mt-1"
                  type="number"
                  step="any"
                  placeholder="13.7373"
                  value={locLng}
                  onChange={(e) => setLocLng(e.target.value)}
                  onBlur={handleCoordBlur}
                />
              </div>
            </div>

            {lat && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-muted-foreground"
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
          <Button
            onClick={handleMapConfirm}
            className="w-full"
            disabled={!locLat || !locLng}
          >
            Bestätigen
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
