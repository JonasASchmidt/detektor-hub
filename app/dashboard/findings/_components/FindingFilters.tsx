"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useURLFilters } from "@/app/_hooks/useURLFilters";
import { UseFindingsParams } from "@/app/_hooks/useFindings";
import {
  FilterBar,
  SearchFilter,
  SelectFilter,
  DateRangeFilter,
  LocationFilter,
  TagSelectFilter,
  TagOption,
} from "@/components/filters";

const sortOptions = [
  { value: "newest", label: "Neueste zuerst" },
  { value: "oldest", label: "Alteste zuerst" },
  { value: "az", label: "A-Z" },
];

const statusOptions = [
  { value: "all", label: "Alle Status" },
  { value: "COMPLETED", label: "Bestimmt" },
  { value: "DRAFT", label: "Unbestimmt" },
];

const reportedOptions = [
  { value: "all", label: "Alle" },
  { value: "true", label: "Gemeldet" },
  { value: "false", label: "Nicht gemeldet" },
];

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
  const { searchParams, setFilter, setMultipleFilters, clearAll } = useURLFilters();
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

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

  return (
    <FilterBar hasActiveFilters={!!hasActiveFilters} onClearAll={clearAll}>
      <SearchFilter
        value={searchParams.get("q") || ""}
        onChange={(v) => setFilter("q", v)}
        placeholder="Suche nach Name..."
      />

      <SelectFilter
        value={currentSort}
        onChange={(v) => setFilter("sort", v)}
        options={sortOptions}
        placeholder="Sortieren"
      />

      <SelectFilter
        value={currentStatus}
        onChange={(v) => setFilter("status", v)}
        options={statusOptions}
        placeholder="Status"
      />

      <SelectFilter
        value={currentReported}
        onChange={(v) => setFilter("reported", v)}
        options={reportedOptions}
        placeholder="Gemeldet"
        className="w-[170px]"
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
        onClear={() => setMultipleFilters({ lat: null, lng: null, radius: null })}
      />
    </FilterBar>
  );
}
