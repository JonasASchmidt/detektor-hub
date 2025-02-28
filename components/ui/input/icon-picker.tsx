"use client";

import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent } from "../popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Button } from "../button";
import { Label } from "../label";
import DynamicIcon from "./dynamic-icon";

const iconNames: (keyof typeof LucideIcons)[] = [
  "Amphora",
  "Anvil",
  "Axe",
  "Badge",
  "Bolt",
  "Bomb",
  "Bone",
  "Book",
  "Box",
  "BrickWall",
  "Castle",
  "Circle",
  "CircleDot",
  "CircleHelp",
  "Cog",
  "Compass",
  "Crown",
  "Cpu",
  "Cuboid",
  "Cylinder",
  "Diamond",
  "Dices",
  "Drama",
  "Earth",
  "Eye",
  "Feather",
  "FlaskConical",
  "FlaskRound",
  "Flower",
  "Gem",
  "Globe",
  "House",
  "KeyRound",
  "Landmark",
  "LandPlot",
  "Magnet",
  "MapPin",
  "MapPinCheckInside",
  "MapPinHouse",
  "MapPinXInside",
  "Medal",
  "Microscope",
  "Milk",
  "Mountain",
  "Package",
  "Paperclip",
  "Pickaxe",
  "Pyramid",
  "Puzzle",
  "Scale",
  "Shield",
  "ShipWheel",
  "Shovel",
  "Shrub",
  "Sprout",
  "Square",
  "Skull",
  "Star",
  "Sword",
  "Tractor",
  "TreeDeciduous",
  "TreePalm",
  "TreePine",
  "Trophy",
  "Trash2",
  "UtensilsCrossed",
  "Weight",
  "Wheat",
  "Watch",
  "Wrench",
  "Coins",
  "Shell",
];

// Create a new object that maps only valid icon keys to their component
const icons = iconNames.reduce((acc, key) => {
  acc[key] = LucideIcons[key] as React.FC<React.SVGProps<SVGSVGElement>>;
  return acc;
}, {} as Record<keyof typeof LucideIcons, React.FC<React.SVGProps<SVGSVGElement>>>);

interface Props {
  onChange: (icon: keyof typeof LucideIcons) => void;
}

export default function IconPicker({ onChange }: Props) {
  const [selectedIcon, setSelectedIcon] = useState<
    keyof typeof LucideIcons | null
  >(null);
  const [open, setOpen] = useState(false);

  const handleSelectIcon = (icon: keyof typeof icons) => {
    setSelectedIcon(icon);
    setOpen(false); // Close the popover after selection
    onChange(icon);
  };

  const SelectedIconComponent = selectedIcon ? icons[selectedIcon] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label>Icon auswählen</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button className="flex items-center w-full" variant="outline">
              {SelectedIconComponent ? (
                <SelectedIconComponent className="w-6 h-6" />
              ) : (
                "Icon auswählen"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="grid grid-cols-6 gap-1 max-h-[300px] p-2 overflow-y-auto">
            {iconNames.map((iconName) => {
              return (
                <Button
                  key={iconName}
                  onClick={() => handleSelectIcon(iconName)}
                  size="icon"
                  variant="outline"
                >
                  <DynamicIcon icon={iconName} />
                </Button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
