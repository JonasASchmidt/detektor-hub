"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterBarProps {
  children: React.ReactNode;
  hasActiveFilters?: boolean;
  onClearAll?: () => void;
  clearLabel?: string;
}

export function FilterBar({
  children,
  hasActiveFilters,
  onClearAll,
  clearLabel = "Filter zurücksetzen",
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-muted rounded-lg items-center [&_input]:bg-white [&_button]:bg-white [&_[role=combobox]]:bg-white">
      {children}
      {hasActiveFilters && onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="gap-1">
          <X className="h-3.5 w-3.5" />
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
