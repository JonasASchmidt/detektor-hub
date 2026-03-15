"use client";

import * as LucideIcons from "lucide-react";
import { useEffect, useState } from "react";
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
const icons = iconNames.reduce(
  (acc, key) => {
    acc[key] = LucideIcons[key] as React.FC<React.SVGProps<SVGSVGElement>>;
    return acc;
  },
  {} as Record<
    keyof typeof LucideIcons,
    React.FC<React.SVGProps<SVGSVGElement>>
  >,
);

interface Props {
  onChange: (icon: keyof typeof LucideIcons) => void;
  value?: string;
}

export default function IconPicker({ onChange, value }: Props) {
  const [selectedIcon, setSelectedIcon] = useState<
    keyof typeof LucideIcons | null
  >(
    value && iconNames.find((icon) => icon === value)
      ? (value as keyof typeof LucideIcons)
      : null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!value || !iconNames.find((icon) => icon === value)) {
      setSelectedIcon(null);
      return;
    }

    setSelectedIcon(value as keyof typeof LucideIcons);
  }, [value]);

  const handleSelectIcon = (icon: keyof typeof icons) => {
    setSelectedIcon(icon);
    setOpen(false); // Close the popover after selection
    onChange(icon);
  };

  const SelectedIconComponent = selectedIcon ? icons[selectedIcon] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="w-8 h-8 p-0 rounded-lg flex-shrink-0 border-black/[0.05] hover:border-zinc-400 transition-colors"
          variant="outline"
        >
          {SelectedIconComponent ? (
            <SelectedIconComponent className="w-5 h-5" />
          ) : (
            <LucideIcons.Plus className="w-4 h-4 text-muted-foreground/50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="grid grid-cols-6 gap-1 max-h-[300px] p-2 overflow-y-auto border-black/[0.05] shadow-2xl rounded-xl">
        {iconNames.map((iconName) => {
          return (
            <Button
              key={iconName}
              onClick={() => handleSelectIcon(iconName)}
              size="icon"
              variant="ghost"
              className="w-10 h-10 hover:bg-muted hover:text-foreground [&_svg]:hover:text-foreground rounded-md"
            >
              <DynamicIcon icon={iconName} />
            </Button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
