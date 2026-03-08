"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string | null) => void;
  onDateToChange: (value: string | null) => void;
  onClear: () => void;
  label?: string;
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  label = "Zeitraum",
}: DateRangeFilterProps) {
  const hasValue = dateFrom || dateTo;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          {hasValue
            ? `${dateFrom ? format(new Date(dateFrom), "dd.MM.yy", { locale: de }) : "..."} - ${dateTo ? format(new Date(dateTo), "dd.MM.yy", { locale: de }) : "..."}`
            : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Von</p>
            <Calendar
              mode="single"
              selected={dateFrom ? new Date(dateFrom) : undefined}
              onSelect={(date) =>
                onDateFromChange(date ? date.toISOString() : null)
              }
              locale={de}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bis</p>
            <Calendar
              mode="single"
              selected={dateTo ? new Date(dateTo) : undefined}
              onSelect={(date) =>
                onDateToChange(date ? date.toISOString() : null)
              }
              locale={de}
            />
          </div>
          {hasValue && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Zeitraum zurücksetzen
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
