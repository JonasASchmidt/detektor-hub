"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useURLFilters } from "@/app/_hooks/useURLFilters";
import { UseFindingsParams } from "@/app/_hooks/useFindings";
import {
  FilterBar,
  SearchFilter,
  DateRangeFilter,
  LocationFilter,
  TagSelectFilter,
  TagOption,
  MultiSelectFilter,
  FilterChips,
} from "@/components/filters";
import type { MultiSelectOption } from "@/components/filters";

export const sortOptions = [
  { value: "newest", label: "Neueste zuerst" },
  { value: "oldest", label: "Älteste zuerst" },
  { value: "az", label: "A-Z" },
];

const statusFilterOptions: MultiSelectOption[] = [
  { value: "status:COMPLETED", label: "Aktiv", group: "status" },
  { value: "status:DRAFT", label: "Entwurf", group: "status" },
  { value: "reported:true", label: "Gemeldet", group: "reported" },
  { value: "reported:false", label: "Nicht gemeldet", group: "reported" },
];

// Parse combined filter chips into status and reported URL params
function chipsToParams(chips: string[]) {
  const statuses = chips
    .filter((c) => c.startsWith("status:"))
    .map((c) => c.replace("status:", ""));
  const reportedChips = chips.filter((c) => c.startsWith("reported:"));

  return {
    status: statuses.length > 0 ? statuses.join(",") : null,
    reported:
      reportedChips.length === 1
        ? reportedChips[0].replace("reported:", "")
        : null,
  };
}

// Parse URL params back into chip values
function paramsToChips(
  status: string | null,
  reported: string | null
): string[] {
  const chips: string[] = [];
  if (status) {
    for (const s of status.split(",").filter(Boolean)) {
      chips.push(`status:${s}`);
    }
  }
  if (reported && reported !== "all") {
    chips.push(`reported:${reported}`);
  }
  return chips;
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
  const lat = searchParams.get("lat")
    ? parseFloat(searchParams.get("lat")!)
    : undefined;
  const lng = searchParams.get("lng")
    ? parseFloat(searchParams.get("lng")!)
    : undefined;
  const radius = searchParams.get("radius")
    ? parseFloat(searchParams.get("radius")!)
    : undefined;

  const orderBy = sort === "az" ? "name" : "createdAt";
  const order: "asc" | "desc" =
    sort === "oldest" || sort === "az" ? "asc" : "desc";

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
  const { searchParams, setFilter, setMultipleFilters, clearAll } =
    useURLFilters();
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

  const currentStatus = searchParams.get("status") || null;
  const currentReported = searchParams.get("reported") || null;
  const selectedChips = paramsToChips(currentStatus, currentReported);

  const currentTags = searchParams.get("tags")
    ? searchParams.get("tags")!.split(",").filter(Boolean)
    : [];
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const currentLat = searchParams.get("lat") || "";
  const currentLng = searchParams.get("lng") || "";
  const currentRadius = searchParams.get("radius") || "";

  const hasActiveFilters =
    selectedChips.length > 0 ||
    currentTags.length > 0 ||
    currentDateFrom ||
    currentDateTo ||
    currentLat;

  const handleChipsChange = (chips: string[]) => {
    const params = chipsToParams(chips);
    setMultipleFilters(params);
  };

  const handleRemoveChip = (chip: string) => {
    handleChipsChange(selectedChips.filter((c) => c !== chip));
  };

  return (
    <FilterBar hasActiveFilters={!!hasActiveFilters} onClearAll={clearAll}>
      <SearchFilter
        value={searchParams.get("q") || ""}
        onChange={(v) => setFilter("q", v)}
        placeholder="Suche nach Name..."
      />

      <MultiSelectFilter
        selected={selectedChips}
        onChange={handleChipsChange}
        options={statusFilterOptions}
        placeholder="Status"
      />

      <TagSelectFilter
        selectedIds={currentTags}
        options={availableTags}
        onChange={(ids) =>
          setFilter("tags", ids.length > 0 ? ids.join(",") : null)
        }
      />

      <DateRangeFilter
        dateFrom={currentDateFrom}
        dateTo={currentDateTo}
        onDateFromChange={(v) => setFilter("dateFrom", v)}
        onDateToChange={(v) => setFilter("dateTo", v)}
        onClear={() => setMultipleFilters({ dateFrom: null, dateTo: null })}
      />

      <LocationFilter
        lat={currentLat}
        lng={currentLng}
        radius={currentRadius}
        onApply={(lat, lng, radius) =>
          setMultipleFilters({ lat, lng, radius })
        }
        onClear={() =>
          setMultipleFilters({ lat: null, lng: null, radius: null })
        }
      />

      <FilterChips
        selected={selectedChips}
        options={statusFilterOptions}
        onRemove={handleRemoveChip}
      />
    </FilterBar>
  );
}
