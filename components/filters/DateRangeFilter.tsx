"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const hasValue = dateFrom || dateTo;

  const handleDateFromChange = (date: Date | undefined) => {
    onDateFromChange(date ? date.toISOString() : null);
  };

  const handleDateToChange = (date: Date | undefined) => {
    onDateToChange(date ? date.toISOString() : null);
    if (date) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 shrink-0 h-8 whitespace-nowrap text-muted-foreground">
          <CalendarIcon className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        collisionPadding={8}
      >
        <div className="p-2">
          <div className="flex gap-2">
            <div>
              <p className="text-xs text-muted-foreground px-1 mb-0.5">Von</p>
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={handleDateFromChange}
                locale={de}
                className="p-1"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground px-1 mb-0.5">Bis</p>
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={handleDateToChange}
                locale={de}
                className="p-1"
              />
            </div>
          </div>
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 mt-1 text-muted-foreground"
              onClick={() => { onClear(); setOpen(false); }}
            >
              Zeitraum zurücksetzen
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
