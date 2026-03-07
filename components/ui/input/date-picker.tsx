"use client";

import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../calendar";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";

export default function DatePicker<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  placeholder,
}: UseControllerProps<TFieldValues> & { placeholder: string }) {
  const { field, fieldState: _fieldState } = useController({
    name,
    control,
    rules,
  });

  const [date, setDate] = useState<Date | undefined>(field.value);

  useEffect(() => {
    if (field.value) {
      setDate(field.value);
    }
  }, [field.value]);

  const onChangeDate = (updatedDate?: Date) => {
    setDate(updatedDate);
    field.onChange(updatedDate);
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
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
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
