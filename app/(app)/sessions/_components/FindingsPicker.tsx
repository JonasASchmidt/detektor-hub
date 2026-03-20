"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckSquare2, Search, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { FindingOption } from "./SessionForm";

interface Props {
  allFindings: FindingOption[];
  /** Zone- and date-filtered subset, computed by the parent */
  filteredFindings: FindingOption[];
  initialSelectedIds?: string[];
  onChange: (ids: Set<string>) => void;
}

export default function FindingsPicker({
  allFindings,
  filteredFindings,
  initialSelectedIds = [],
  onChange,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const hiddenCount = allFindings.length - filteredFindings.length;
  const displayFindings = showAll ? allFindings : filteredFindings;

  const visibleFindings = useMemo(() => {
    if (!search.trim()) return displayFindings;
    const q = search.toLowerCase();
    return displayFindings.filter((f) => (f.name ?? "").toLowerCase().includes(q));
  }, [displayFindings, search]);

  const allVisibleSelected =
    visibleFindings.length > 0 && visibleFindings.every((f) => selectedIds.has(f.id));

  const update = (next: Set<string>) => {
    setSelectedIds(next);
    onChange(next);
  };

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    update(next);
  };

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleFindings.forEach((f) => next.delete(f.id));
    } else {
      visibleFindings.forEach((f) => next.add(f.id));
    }
    update(next);
  };

  const hasFilter =
    filteredFindings.length < allFindings.length;

  return (
    <Card className="rounded-none border-0 bg-transparent md:rounded-xl md:bg-white md:dark:bg-gray-900 md:border md:border-border">
      <div className="py-0 px-0 md:py-4 md:px-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xl font-bold">Funde zuordnen</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedIds.size} von {allFindings.length} ausgewählt
              {hasFilter && (
                <span> · {filteredFindings.length} im gefilterten Bereich</span>
              )}
            </p>
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0 mt-1"
            >
              {showAll ? "Nur gefilterte zeigen" : `Alle ${allFindings.length} anzeigen`}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Funde suchen …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* List */}
        {visibleFindings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {allFindings.length === 0
              ? "Noch keine Funde vorhanden."
              : "Keine Funde im aktuellen Filter."}
          </p>
        ) : (
          <div className="flex flex-col rounded-md border border-border overflow-hidden">
            {/* Select-all row */}
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors text-left"
            >
              {allVisibleSelected
                ? <CheckSquare2 className="h-3.5 w-3.5 shrink-0" />
                : <Square className="h-3.5 w-3.5 shrink-0" />}
              Alle {visibleFindings.length} {!showAll && hasFilter ? "gefilterten " : ""}auswählen
            </button>

            {/* Individual rows */}
            <div className="max-h-64 overflow-y-auto divide-y divide-border border-t border-border">
              {visibleFindings.map((f) => {
                const checked = selectedIds.has(f.id);
                const inFilter = filteredFindings.some((ff) => ff.id === f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors${!inFilter && showAll ? " opacity-50" : ""}`}
                  >
                    {checked
                      ? <CheckSquare2 className="h-4 w-4 shrink-0 text-foreground" />
                      : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {f.name ?? "(kein Name)"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(f.foundAt), "dd.MM.yyyy", { locale: de })}
                        {!inFilter && showAll && " · außerhalb des Filters"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
