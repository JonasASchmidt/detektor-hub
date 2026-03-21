"use client";

import type { Image } from "@prisma/client";
import { CldImage } from "next-cloudinary";
import { Button } from "../ui/button";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { MouseEventHandler, useRef, useState } from "react";
import { ConfirmModal } from "../modals/ConfirmModal";
import { toast } from "sonner";
import ImageEditor from "./ImageEditor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface Props {
  isSelected: boolean;
  onClick: (id: string) => void;
  onSelectToggle: (id: string) => void;
  onDelete: (id: string) => void;
  image: Image;
}

export default function ImageCard({
  isSelected,
  onClick,
  onSelectToggle,
  onDelete,
  image,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    cardRef.current?.blur();
  };

  const handleChangeImage = (_image: Image) => {};

  const handleConfirm = async () => {
    const res = await fetch(`/api/images/${image.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      return toast.error(data.error);
    }

    toast.success("Foto wurde gelöscht!");
    onDelete(image.id);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={cardRef}
            onClick={() => onClick(image.id)}
            className={`relative group cursor-pointer transition rounded-lg overflow-hidden ${
              isSelected ? "ring-2 ring-inset ring-zinc-800" : ""
            }`}
            tabIndex={0}
          >
            <div className="relative aspect-square">
              {!loaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <CldImage
                src={image.publicId}
                fill
                crop="fill"
                gravity="auto"
                alt={image.title || "Bild"}
                quality="auto"
                format="auto"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                onLoad={() => setLoaded(true)}
              />
              {(image.title || image.description) && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.title && <p className="text-[11px] font-semibold leading-tight truncate">{image.title}</p>}
                  {image.description && <p className="text-[10px] text-white/75 leading-tight truncate">{image.description}</p>}
                </div>
              )}
              <div
                className="absolute top-1 right-1 p-2 z-10 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onSelectToggle(image.id); }}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 fill-white drop-shadow-sm" />
                ) : (
                  <Circle className="w-6 h-6 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-800 text-white">
          <div className="flex flex-col gap-0.5">
            <p className="font-medium truncate max-w-[200px]">{image.originalFilename || "Unbekannt"}</p>
            <p className="text-[10px] text-zinc-400">
              {image.width && image.height ? `${image.width} × ${image.height} px` : "Keine Auflösung"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
