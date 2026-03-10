"use client";

import type { Image } from "@prisma/client";
import { Card, CardContent } from "../ui/card";
import { CldImage } from "next-cloudinary";
import { Button } from "../ui/button";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { MouseEventHandler, useRef } from "react";
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
          <Card
            ref={cardRef}
            onClick={() => onClick(image.id)}
            className={`relative group cursor-pointer transition border-2 ${
              isSelected ? "border-zinc-800" : "border-transparent"
            }`}
            tabIndex={0}
          >
            <CardContent className="p-2 relative aspect-[1/1]">
              <CldImage
                src={image.publicId}
                width={200}
                height={200}
                crop="fill"
                gravity="auto"
                alt="Image"
                quality="auto"
                format="auto"
                className="rounded-lg object-cover w-full h-full"
              />

              <div 
                className="absolute top-1 right-1 p-2 z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectToggle(image.id);
                }}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 fill-white drop-shadow-sm" />
                ) : (
                  <Circle className="w-6 h-6 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <div className="absolute bottom-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <ImageEditor image={image} onChange={handleChangeImage} />
                <ConfirmModal
                  onConfirm={handleConfirm}
                  title="Foto löschen"
                  description="Sind Sie sicher, dass Sie dieses Foto löschen wollen?"
                  trigger={
                    <Button size="icon" variant="destructive" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
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
