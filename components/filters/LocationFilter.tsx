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
import { MapPin } from "lucide-react";

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude.toFixed(6);
          const newLng = pos.coords.longitude.toFixed(6);
          setLocLat(newLat);
          setLocLng(newLng);
          onApply(newLat, newLng, locRadius);
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {lat ? `Umkreis: ${radius || defaultRadius}km` : "Umkreis"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-3">
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
            <label className="text-xs text-muted-foreground">Laengengrad</label>
            <Input
              type="number"
              step="any"
              placeholder="z.B. 13.7373"
              value={locLng}
              onChange={(e) => setLocLng(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Radius (km)</label>
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
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply} className="flex-1">
              Anwenden
            </Button>
            <Button size="sm" variant="outline" onClick={useCurrentPosition}>
              Aktuelle Position
            </Button>
          </div>
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
  );
}
