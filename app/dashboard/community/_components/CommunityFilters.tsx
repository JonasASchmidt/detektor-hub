"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X } from "lucide-react";
import { useURLFilters } from "@/app/_hooks/useURLFilters";
import {
  FilterBar,
  SearchFilter,
  DateRangeFilter,
  TagSelectFilter,
  TagOption,
  SelectFilter,
} from "@/components/filters";

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

export default function CommunityFilters() {
  const { searchParams, setFilter, setMultipleFilters, clearAll } =
    useURLFilters();
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

  const currentTags = searchParams.get("tags")
    ? searchParams.get("tags")!.split(",").filter(Boolean)
    : [];
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";

  const hasDateFilter = !!(currentDateFrom || currentDateTo);

  const hasActiveFilters = currentTags.length > 0 || hasDateFilter;

  const dateChipLabel = hasDateFilter
    ? formatDateRange(currentDateFrom, currentDateTo)
    : null;

  const hasChips = currentTags.length > 0 || dateChipLabel;

  return (
    <FilterBar
      hasActiveFilters={!!hasActiveFilters}
      onClearAll={clearAll}
      chips={hasChips ? (
        <>
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
        </>
      ) : undefined}
    >
        <SearchFilter
          value={searchParams.get("q") || ""}
          onChange={(v) => setFilter("q", v)}
          placeholder="Öffentliche Funde suchen..."
          className="flex-1 min-w-[80px]"
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

        <SelectFilter
          value={searchParams.get("sort") || "newest"}
          onChange={(v) => setFilter("sort", v)}
          options={[{ value: "newest", label: "Neueste zuerst" }]}
          placeholder="Sortieren"
          className="w-[140px]"
        />
      </FilterBar>
  );
}
