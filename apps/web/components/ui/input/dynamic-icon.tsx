"use client";

import * as LucideIcons from "lucide-react";

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

const icons = iconNames.reduce((acc, key) => {
  acc[key] = LucideIcons[key] as React.FC<React.SVGProps<SVGSVGElement>>;
  return acc;
}, {} as Record<keyof typeof LucideIcons, React.FC<React.SVGProps<SVGSVGElement>>>);

interface Props {
  icon: string;
  size?: number;
}

export default function DynamicIcon({ icon, size = 16 }: Props) {
  if (!iconNames.includes(icon as keyof typeof LucideIcons)) {
    return null;
  }

  const IconComponent = icons[icon as keyof typeof LucideIcons];

  return <IconComponent style={{ width: `${size}px`, height: `${size}px` }} />;
}
