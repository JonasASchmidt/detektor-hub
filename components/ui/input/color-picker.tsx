"use client";

import { useState } from "react";
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
}

export default function ColorPicker({ onChange }: Props) {
  const [color, setColor] = useState("#ff0000");

  const handleChangeColor = (newColor: string) => {
    setColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-1">
      <Label>Farbe auswählen</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center w-full">
            <span
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: color }}
            ></span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-auto">
          <HexColorPicker color={color} onChange={handleChangeColor} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
