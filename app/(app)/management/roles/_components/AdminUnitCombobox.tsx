"use client";

import { useEffect, useState, useRef } from "react";
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type AdminUnitType = "FEDERAL_STATE" | "COUNTY" | "MUNICIPALITY";

interface Props {
  type: AdminUnitType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER: Record<AdminUnitType, string> = {
  FEDERAL_STATE: "Bundesland wählen…",
  COUNTY: "Landkreis suchen…",
  MUNICIPALITY: "Gemeinde suchen…",
};

export default function AdminUnitCombobox({ type, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Federal states: fetch once on mount. Counties/municipalities: fetch on search change.
  useEffect(() => {
    if (type === "FEDERAL_STATE") {
      setLoading(true);
      fetch("/api/geo/admin-units/list?type=FEDERAL_STATE")
        .then((r) => r.json())
        .then((data) => setNames(data.names ?? []))
        .catch(() => setNames([]))
        .finally(() => setLoading(false));
    }
  }, [type]);

  useEffect(() => {
    if (type === "FEDERAL_STATE") return;
    if (search.length < 2) {
      setNames([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/geo/admin-units/list?type=${type}&q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data) => setNames(data.names ?? []))
        .catch(() => setNames([]))
        .finally(() => setLoading(false));
    }, 300);
  }, [search, type]);

  // Reset search + results when type changes
  useEffect(() => {
    setSearch("");
    setNames([]);
  }, [type]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || PLACEHOLDER[type]}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          {/* Only show search input for county/municipality */}
          {type !== "FEDERAL_STATE" && (
            <CommandInput
              placeholder={`${type === "COUNTY" ? "Landkreis" : "Gemeinde"} suchen…`}
              value={search}
              onValueChange={setSearch}
            />
          )}
          {type === "FEDERAL_STATE" && (
            <CommandInput placeholder="Bundesland suchen…" />
          )}
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && names.length === 0 && (
              <CommandEmpty>
                {type === "FEDERAL_STATE"
                  ? "Keine Ergebnisse"
                  : search.length < 2
                  ? "Mindestens 2 Zeichen eingeben"
                  : "Keine Ergebnisse"}
              </CommandEmpty>
            )}
            {names.length > 0 && (
              <CommandGroup>
                {names.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={(selected) => {
                      onChange(selected === value ? "" : selected);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
