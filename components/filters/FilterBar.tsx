"use client";

import { X } from "lucide-react";

interface FilterBarProps {
  children: React.ReactNode;
  chips?: React.ReactNode;
  hasActiveFilters?: boolean;
  onClearAll?: () => void;
  clearLabel?: string;
}

export function FilterBar({
  children,
  chips,
  hasActiveFilters,
  onClearAll,
  clearLabel = "Filter zurücksetzen",
}: FilterBarProps) {
  return (
    <div className="bg-muted rounded-lg border border-border [&_input]:bg-white [&_button]:bg-white [&_[role=combobox]]:bg-white">
      <div className="flex flex-nowrap gap-3 p-4 items-center overflow-x-auto">
        {children}
        {hasActiveFilters && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            title={clearLabel}
            className="shrink-0 ml-auto flex items-center justify-center h-8 w-8 rounded-md border border-input bg-white text-muted-foreground shadow-sm hover:bg-accent"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {/* Grid trick: animates height 0↔auto without JS measurement */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: chips ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="flex flex-wrap gap-2 px-4 pb-3 items-center">
            {chips}
          </div>
        </div>
      </div>
    </div>
  );
}
