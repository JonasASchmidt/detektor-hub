"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X } from "lucide-react";
import { useURLFilters } from "@/hooks/useURLFilters";
import {
  FilterBar,
  SearchFilter,
  DateRangeFilter,
  TagSelectFilter,
  TagOption,
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
                {tag?.name ?? "…"}
                <button type="button" onClick={() => setFilter("tags", currentTags.filter((t) => t !== id).join(",") || null)} className="group !bg-transparent rounded-full p-0.5">
                  <X className="h-3 w-3 text-white/50 group-hover:text-white transition-colors" />
                </button>
              </span>
            );
          })}
          {dateChipLabel && (
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-sm font-medium text-white" style={{ backgroundColor: "#9aa8b2" }}>
              {dateChipLabel}
              <button type="button" onClick={() => setMultipleFilters({ dateFrom: null, dateTo: null })} className="group !bg-transparent rounded-full p-0.5">
                <X className="h-3 w-3 text-white/50 group-hover:text-white transition-colors" />
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

      </FilterBar>
  );
}
