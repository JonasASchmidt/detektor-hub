"use client";

import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  onChange: (color: string) => void;
  value?: string;
}

export default function ColorPicker({ onChange, value }: Props) {
  const [color, setColor] = useState(value ?? "#ff0000");

  useEffect(() => {
    if (!value) {
      return;
    }

    setColor(value);
  }, [value]);

  const handleChangeColor = (newColor: string) => {
    setColor(newColor);
    onChange(newColor);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-8 h-8 p-0 rounded-lg flex-shrink-0 border-black/[0.05]">
          <span
            className="w-5 h-5 rounded-md border border-black/[0.05] shadow-sm"
            style={{ backgroundColor: color }}
          ></span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-auto border-black/[0.05] shadow-2xl rounded-xl">
        <HexColorPicker color={color} onChange={handleChangeColor} />
      </PopoverContent>
    </Popover>
  );
}
