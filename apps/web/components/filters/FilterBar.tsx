"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="rounded-lg border border-border [&_input]:bg-white [&_button]:bg-white [&_[role=combobox]]:bg-white" style={{ backgroundColor: "#F6F6F2" }}>
      <div className="flex flex-nowrap gap-3 p-4 items-center overflow-x-auto">
        {children}
        {hasActiveFilters && onClearAll && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClearAll}
            title={clearLabel}
            className="shrink-0 ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
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
