"use client";

import { Image } from "@prisma/client";
import { Card, CardContent } from "../ui/card";
import { CldImage } from "next-cloudinary";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { MouseEventHandler, useRef } from "react";
import { ConfirmModal } from "../modals/ConfirmModal";
import { toast } from "sonner";
import ImageEditor from "./ImageEditor";

interface Props {
  isSelected: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  image: Image;
}

export default function ImageCard({
  isSelected,
  onClick,
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
    <Card
      ref={cardRef}
      onClick={() => onClick(image.id)}
      className={`relative group cursor-pointer transition ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      tabIndex={0}
    >
      <CardContent className="p-2">
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
  );
}
