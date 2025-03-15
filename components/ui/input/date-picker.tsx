"use client";

import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../calendar";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Props {
  onChange: (value?: Date) => void;
  value?: Date;
}

export default function DatePicker({ onChange, value }: Props) {
  const [date, setDate] = useState<Date | undefined>(value);

  useEffect(() => {
    if (value) {
      setDate(value);
    }
  }, [value]);

  const onChangeDate = (updatedDate?: Date) => {
    setDate(updatedDate);
    onChange(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChangeDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
