"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (value: string) => {
    const opt = options.find((o) => o.value === value);
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      // Remove other options in the same group (radio behavior)
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
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-8 rounded-md border border-input bg-white px-3 text-sm shadow-sm hover:bg-accent min-w-[140px]"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <span className="text-sm truncate">
            {selected.length} ausgewählt
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-52 rounded-md border bg-white shadow-md py-1">
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
                      "flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-accent",
                      active && "font-medium"
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        active
                          ? "border-primary"
                          : "border-input"
                      )}
                    >
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
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

  const getLabel = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      {selected.map((value) => (
        <span
          key={value}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium"
        >
          {getLabel(value)}
          <button
            type="button"
            onClick={() => onRemove(value)}
            className="hover:bg-primary/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </>
  );
}
