"use client";

import { Image } from "@prisma/client";
import { CldImage } from "next-cloudinary";
import { Button } from "../ui/button";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import ImageEditor from "./ImageEditor";
import ImageDeleteDialog from "./ImageDeleteDialog";

interface Props {
  isSelected: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  image: Image;
}

export default function ImageCard({ isSelected, onClick, onDelete, image }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleChangeImage = (_image: Image) => {};

  return (
    <>
      <div
        onClick={() => onClick(image.id)}
        className={`relative group cursor-pointer transition overflow-hidden ${
          isSelected ? "ring-2 ring-inset ring-zinc-800" : ""
        }`}
        tabIndex={0}
      >
        <div className="relative aspect-square">
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
          />
          {(image.title || image.description) && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {image.title && <p className="text-[11px] font-semibold leading-tight truncate">{image.title}</p>}
              {image.description && <p className="text-[10px] text-white/75 leading-tight truncate">{image.description}</p>}
            </div>
          )}

          <div className="absolute top-2 right-2">
            {isSelected ? (
              <CheckCircle2 className="w-6 h-6 text-zinc-800 fill-white" />
            ) : (
              <Circle className="w-6 h-6 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          <div className="absolute bottom-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <ImageEditor image={image} onChange={handleChangeImage} />
            <Button
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ImageDeleteDialog
        image={image}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={(id) => { onDelete(id); setDeleteOpen(false); }}
      />
    </>
  );
}
