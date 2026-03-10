"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X } from "lucide-react";
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

function formatDateRange(fromIso: string, toIso: string): string {
  const from = fromIso ? new Date(fromIso) : null;
  const to = toIso ? new Date(toIso) : null;

  if (!from && !to) return "";
  if (!from) return `bis ${format(to!, "dd.MM.yy", { locale: de })}`;
  if (!to) return `ab ${format(from, "dd.MM.yy", { locale: de })}`;

  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  const fromStr = sameMonth
    ? format(from, "d.", { locale: de })
    : sameYear
    ? format(from, "d.MM.", { locale: de })
    : format(from, "dd.MM.yy", { locale: de });

  const toStr = format(to, "dd.MM.yy", { locale: de });

  return `${fromStr} – ${toStr}`;
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

  const hasDateFilter = !!(currentDateFrom || currentDateTo);
  const hasLocationFilter = !!currentLat;

  const hasActiveFilters =
    selectedChips.length > 0 ||
    currentTags.length > 0 ||
    hasDateFilter ||
    hasLocationFilter;

  const handleChipsChange = (chips: string[]) => {
    const params = chipsToParams(chips);
    setMultipleFilters(params);
  };

  const handleRemoveChip = (chip: string) => {
    handleChipsChange(selectedChips.filter((c) => c !== chip));
  };

  const dateChipLabel = hasDateFilter
    ? formatDateRange(currentDateFrom, currentDateTo)
    : null;

  const locationChipLabel = hasLocationFilter
    ? `Umkreis: ${currentRadius || "25"} km`
    : null;

  const hasChips =
    selectedChips.length > 0 ||
    currentTags.length > 0 ||
    dateChipLabel ||
    locationChipLabel;

  return (
    <FilterBar
      hasActiveFilters={!!hasActiveFilters}
      onClearAll={clearAll}
      chips={hasChips ? (
        <>
          <FilterChips selected={selectedChips} options={statusFilterOptions} onRemove={handleRemoveChip} />
          {currentTags.map((id) => {
            const tag = availableTags.find((t) => t.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-sm font-medium text-white" style={{ backgroundColor: tag?.color ?? "#888" }}>
                {tag?.name ?? id}
                <button type="button" onClick={() => setFilter("tags", currentTags.filter((t) => t !== id).join(",") || null)} className="!bg-transparent !text-foreground rounded-full p-0.5 hover:bg-black/20 hover:!text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {dateChipLabel && (
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
              {dateChipLabel}
              <button type="button" onClick={() => setMultipleFilters({ dateFrom: null, dateTo: null })} className="bg-transparent rounded-full p-0.5 hover:bg-primary/20">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {locationChipLabel && (
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
              {locationChipLabel}
              <button type="button" onClick={() => setMultipleFilters({ lat: null, lng: null, radius: null })} className="bg-transparent rounded-full p-0.5 hover:bg-primary/20">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </>
      ) : undefined}
    >
        <SearchFilter
          value={searchParams.get("q") || ""}
          onChange={(v) => setFilter("q", v)}
          placeholder="Suche..."
          className="flex-1 min-w-[80px]"
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
      </FilterBar>
  );
}
