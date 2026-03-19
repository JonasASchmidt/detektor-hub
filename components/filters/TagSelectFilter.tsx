"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag, X } from "lucide-react";
import DynamicIcon from "@/components/ui/input/dynamic-icon";

export interface TagOption {
  id: string;
  name: string;
  color: string;
  icon?: string;
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 shrink-0 h-8 ${selectedIds.length > 0 ? "text-foreground" : "text-muted-foreground"}`}
        >
          <Tag className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1 max-h-72 overflow-y-auto"
        align="start"
        collisionPadding={8}
      >
        <div className="space-y-0.5">
          {options.map((tag) => {
            const active = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${
                  active ? "bg-accent font-medium" : ""
                }`}
              >
                <span className="shrink-0" style={{ color: tag.color }}>
                  <DynamicIcon icon={tag.icon ?? ""} size={12} />
                </span>
                <span className="flex-1 text-left">{tag.name}</span>
                {active && (
                  <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground p-2">{emptyLabel}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
