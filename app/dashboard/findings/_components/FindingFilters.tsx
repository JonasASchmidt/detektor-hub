"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { useDebounce } from "@/app/_hooks/useDebounce";
import { CalendarIcon, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { UseFindingsParams } from "@/app/_hooks/useFindings";

interface TagOption {
  id: string;
  name: string;
  color: string;
}

export function useFiltersFromURL(): UseFindingsParams {
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const status = searchParams.get("status") || undefined;
  const reported = searchParams.get("reported") || undefined;
  const tags = searchParams.get("tags")
    ? searchParams.get("tags")!.split(",").filter(Boolean)
    : undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const radius = searchParams.get("radius")
    ? parseFloat(searchParams.get("radius")!)
    : undefined;

  const orderBy = sort === "az" ? "name" : "createdAt";
  const order: "asc" | "desc" = sort === "oldest" || sort === "az" ? "asc" : "desc";

  return {
    search: q || undefined,
    orderBy,
    order,
    status,
    reported,
    tags,
    dateFrom,
    dateTo,
    lat,
    lng,
    radius,
  };
}

export default function FindingsFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Local state for search (debounced)
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Available tags
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  // Location popover state
  const [locLat, setLocLat] = useState(searchParams.get("lat") || "");
  const [locLng, setLocLng] = useState(searchParams.get("lng") || "");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch("/api/tags");
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data);
        }
      } catch {
        // ignore
      }
    };
    fetchTags();
  }, []);

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
        // Reset page when filters change
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname]
  );

  const setMultipleFilters = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "") {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        }
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname]
  );

  // Sync debounced search to URL
  useEffect(() => {
    setFilter("q", debouncedSearch || null);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Read current filter values from URL
  const currentSort = searchParams.get("sort") || "newest";
  const currentStatus = searchParams.get("status") || "all";
  const currentReported = searchParams.get("reported") || "all";
  const currentTags = searchParams.get("tags")
    ? searchParams.get("tags")!.split(",").filter(Boolean)
    : [];
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const currentLat = searchParams.get("lat") || "";
  const currentLng = searchParams.get("lng") || "";
  const currentRadius = searchParams.get("radius") || "";

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentReported !== "all" ||
    currentTags.length > 0 ||
    currentDateFrom ||
    currentDateTo ||
    currentLat;

  const clearAllFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
      setSearchInput("");
    });
  };

  const toggleTag = (tagId: string) => {
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    setFilter("tags", newTags.length > 0 ? newTags.join(",") : null);
  };

  const removeTag = (tagId: string) => {
    const newTags = currentTags.filter((t) => t !== tagId);
    setFilter("tags", newTags.length > 0 ? newTags.join(",") : null);
  };

  const applyLocation = () => {
    if (locLat && locLng) {
      setMultipleFilters({
        lat: locLat,
        lng: locLng,
        radius: currentRadius || "25",
      });
    }
  };

  const clearLocation = () => {
    setMultipleFilters({ lat: null, lng: null, radius: null });
    setLocLat("");
    setLocLng("");
  };

  const useCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setLocLat(lat);
          setLocLng(lng);
          setMultipleFilters({
            lat,
            lng,
            radius: currentRadius || "25",
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 p-4 bg-muted rounded-lg items-center">
        {/* Search */}
        <Input
          placeholder="Suche nach Name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full md:max-w-[200px]"
        />

        {/* Sort */}
        <Select value={currentSort} onValueChange={(v) => setFilter("sort", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sortieren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="oldest">Alteste zuerst</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={currentStatus} onValueChange={(v) => setFilter("status", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="COMPLETED">Bestimmt</SelectItem>
            <SelectItem value="DRAFT">Unbestimmt</SelectItem>
          </SelectContent>
        </Select>

        {/* Reported */}
        <Select value={currentReported} onValueChange={(v) => setFilter("reported", v)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Gemeldet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="true">Gemeldet</SelectItem>
            <SelectItem value="false">Nicht gemeldet</SelectItem>
          </SelectContent>
        </Select>

        {/* Tag filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Tags {currentTags.length > 0 && `(${currentTags.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-h-60 overflow-y-auto">
            <div className="space-y-1">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent ${
                    currentTags.includes(tag.id) ? "bg-accent font-medium" : ""
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
              {availableTags.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">Keine Tags verfügbar</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {currentDateFrom || currentDateTo
                ? `${currentDateFrom ? format(new Date(currentDateFrom), "dd.MM.yy", { locale: de }) : "..."} - ${currentDateTo ? format(new Date(currentDateTo), "dd.MM.yy", { locale: de }) : "..."}`
                : "Zeitraum"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Von</p>
                <Calendar
                  mode="single"
                  selected={currentDateFrom ? new Date(currentDateFrom) : undefined}
                  onSelect={(date) =>
                    setFilter("dateFrom", date ? date.toISOString() : null)
                  }
                  locale={de}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bis</p>
                <Calendar
                  mode="single"
                  selected={currentDateTo ? new Date(currentDateTo) : undefined}
                  onSelect={(date) =>
                    setFilter("dateTo", date ? date.toISOString() : null)
                  }
                  locale={de}
                />
              </div>
              {(currentDateFrom || currentDateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setMultipleFilters({ dateFrom: null, dateTo: null })
                  }
                >
                  Zeitraum zurücksetzen
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Location radius */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {currentLat
                ? `Umkreis: ${currentRadius || 25}km`
                : "Umkreis"}
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
                <Select
                  value={currentRadius || "25"}
                  onValueChange={(v) => setFilter("radius", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 km</SelectItem>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={applyLocation} className="flex-1">
                  Anwenden
                </Button>
                <Button size="sm" variant="outline" onClick={useCurrentPosition}>
                  Aktuelle Position
                </Button>
              </div>
              {currentLat && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={clearLocation}
                >
                  Umkreis entfernen
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
            <X className="h-3.5 w-3.5" />
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Active tag chips */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {currentTags.map((tagId) => {
            const tag = availableTags.find((t) => t.id === tagId);
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => removeTag(tagId)}
              >
                {tag ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </>
                ) : (
                  tagId
                )}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
