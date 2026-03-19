"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { UI, DayFlag, SelectionState } from "react-day-picker";
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
        <Button variant="outline" size="sm" className={`gap-1 shrink-0 whitespace-nowrap ${hasValue ? "" : "text-muted-foreground"}`}>
          <CalendarIcon className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        collisionPadding={8}
      >
        <div className="p-1.5">
          <div className="flex gap-1">
            <div>
              <p className="text-xs text-muted-foreground px-1 mb-0.5">Von</p>
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={handleDateFromChange}
                locale={de}
                className="p-0.5"
                classNames={{
                  [UI.Month]: "space-y-3 ml-0",
                  [UI.MonthCaption]: "flex justify-center items-center h-6",
                  [UI.Week]: "flex w-full mt-1",
                  [UI.Weekday]: "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem]",
                  [UI.Day]: "h-8 w-8 text-center rounded-md text-sm p-0 relative focus-within:relative focus-within:z-20",
                  [UI.DayButton]: "h-8 w-8 p-0 font-normal rounded-md hover:bg-primary hover:text-primary-foreground",
                  [SelectionState.selected]: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  [DayFlag.today]: "bg-accent text-accent-foreground",
                  [DayFlag.outside]: "text-muted-foreground opacity-50",
                  [DayFlag.disabled]: "text-muted-foreground opacity-50",
                }}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground px-1 mb-0.5">Bis</p>
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={handleDateToChange}
                locale={de}
                className="p-0.5"
                classNames={{
                  [UI.Month]: "space-y-3 ml-0",
                  [UI.MonthCaption]: "flex justify-center items-center h-6",
                  [UI.Week]: "flex w-full mt-1",
                  [UI.Weekday]: "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem]",
                  [UI.Day]: "h-8 w-8 text-center rounded-md text-sm p-0 relative focus-within:relative focus-within:z-20",
                  [UI.DayButton]: "h-8 w-8 p-0 font-normal rounded-md hover:bg-primary hover:text-primary-foreground",
                  [SelectionState.selected]: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  [DayFlag.today]: "bg-accent text-accent-foreground",
                  [DayFlag.outside]: "text-muted-foreground opacity-50",
                  [DayFlag.disabled]: "text-muted-foreground opacity-50",
                }}
              />
            </div>
          </div>
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 mt-0.5 text-muted-foreground"
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
