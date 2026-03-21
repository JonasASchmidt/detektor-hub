"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
  color?: string;
}

interface MultiSelectFilterProps {
  selected: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
}

export function MultiSelectFilter({
  selected,
  onChange,
  options,
  placeholder = "Filter...",
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    const opt = options.find((o) => o.value === value);
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      const next = opt?.group
        ? selected.filter(
            (v) =>
              options.find((o) => o.value === v)?.group !== opt.group
          )
        : [...selected];
      onChange([...next, value]);
    }
  };

  // Group options by group, preserving order
  const groups: { group: string | undefined; items: MultiSelectOption[] }[] = [];
  for (const opt of options) {
    const last = groups[groups.length - 1];
    if (last && last.group === opt.group) {
      last.items.push(opt);
    } else {
      groups.push({ group: opt.group, items: [opt] });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 h-9 rounded-lg border-2 border-border bg-background px-3 text-sm text-foreground hover:bg-white hover:border-foreground hover:text-black shrink-0 whitespace-nowrap transition-colors",
            className
          )}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="text-sm text-foreground">{selected.length} gewählt</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-44 p-1"
      >
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <hr className="my-1 border-border" />}
            {group.items.map((opt) => {
              const active = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1 text-sm text-left rounded-sm hover:bg-accent",
                    active && "font-medium"
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      active ? "border-primary" : "border-input"
                    )}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span className="flex-1">{opt.label}</span>
                  {active && <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function FilterChips({
  selected,
  options,
  onRemove,
}: {
  selected: string[];
  options: MultiSelectOption[];
  onRemove: (value: string) => void;
}) {
  if (selected.length === 0) return null;

  return (
    <>
      {selected.map((value) => {
        const opt = options.find((o) => o.value === value);
        const color = opt?.color;
        return (
          <span
            key={value}
            className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-sm font-medium ${color ? "text-white" : "text-foreground bg-zinc-200"}`}
            style={color ? { backgroundColor: color } : undefined}
          >
            {opt?.label ?? value}
            <button
              type="button"
              onClick={() => onRemove(value)}
              className="group !bg-transparent rounded-full p-0.5"
            >
              <X className={`h-3 w-3 transition-colors ${color ? "text-white/50 group-hover:text-white" : "text-black/50 group-hover:text-black"}`} />
            </button>
          </span>
        );
      })}
    </>
  );
}
