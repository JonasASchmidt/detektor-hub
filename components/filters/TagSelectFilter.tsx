"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";

export interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TagSelectFilterProps {
  selectedIds: string[];
  options: TagOption[];
  onChange: (ids: string[]) => void;
  label?: string;
  emptyLabel?: string;
}

export function TagSelectFilter({
  selectedIds,
  options,
  onChange,
  label = "Tags",
  emptyLabel = "Keine Tags verfügbar",
}: TagSelectFilterProps) {
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((t) => t !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((t) => t !== id));
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {label} {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 max-h-60 overflow-y-auto">
          <div className="space-y-1">
            {options.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent ${
                  selectedIds.includes(tag.id) ? "bg-accent font-medium" : ""
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">{emptyLabel}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected tag chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 basis-full px-1 pt-1">
          {selectedIds.map((id) => {
            const tag = options.find((t) => t.id === id);
            return (
              <Badge
                key={id}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => remove(id)}
              >
                {tag ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </>
                ) : (
                  id
                )}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </>
  );
}
