"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ScanSearch, Shovel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFindings, UseFindingsParams } from "@/app/_hooks/useFindings";
import { useURLFilters } from "@/app/_hooks/useURLFilters";
import { SelectFilter } from "@/components/filters";
import { sortOptions } from "./FindingFilters";
import FindingCard from "./FindingCard";

interface Props {
  filters: UseFindingsParams;
  onTotalChange?: (total: number) => void;
}

const PAGE_SIZE = 20;

export default function FindingsList({ filters, onTotalChange }: Props) {
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () =>
      ({
        ...filters,
        page,
        pageSize: PAGE_SIZE,
      } as UseFindingsParams),
    [filters, page]
  );

  const { findings, total, loading, error: _error } = useFindings(queryParams);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (!loading) onTotalChange?.(total);
  }, [total, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePrevious = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const { searchParams, setFilter, clearAll } = useURLFilters();
  const currentSort = searchParams.get("sort") || "newest";

  const hasActiveFilters = !!(
    filters.search ||
    filters.status ||
    filters.reported ||
    (filters.tags && filters.tags.length > 0) ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.lat
  );

  const isEmpty = !loading && total === 0;

  return (
    <div className={isEmpty ? "" : "pt-3"}>
      {!isEmpty && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{total} Funde</h2>
          <SelectFilter
            value={currentSort}
            onChange={(v) => setFilter("sort", v)}
            options={sortOptions}
            placeholder="Sortieren"
          />
        </div>
      )}

      {isEmpty && (
        hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <ScanSearch className="h-10 w-10 text-muted-foreground/50" />
            <h2 className="text-2xl font-bold">Keine Funde gefunden</h2>
            <p className="text-sm text-muted-foreground">Deine Filter ergeben keine Treffer.</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={clearAll}>Filter zurücksetzen</Button>
              <Button asChild>
                <Link href="/findings/new">+ Neuer Fund</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Shovel className="h-10 w-10 text-muted-foreground/50" />
            <h2 className="text-2xl font-bold">Noch keine Funde</h2>
            <p className="text-sm text-muted-foreground">Erfasse deinen ersten Fund und dokumentiere ihn hier.</p>
            <Button asChild className="mt-2">
              <Link href="/findings/new">+ Neuer Fund</Link>
            </Button>
          </div>
        )
      )}

      <div className="flex flex-col gap-3">
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          {page > 1 ? (
            <Button variant="ghost" onClick={handlePrevious} disabled={loading}>
              Zurück
            </Button>
          ) : (
            <span />
          )}

          <span className="text-sm text-muted-foreground">
            Seite {page} von {totalPages}
          </span>

          <Button variant="ghost" onClick={handleNext} disabled={page === totalPages || loading}>
            Weiter
          </Button>
        </div>
      )}
    </div>
  );
}
