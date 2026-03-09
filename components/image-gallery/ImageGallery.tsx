"use client";

import { Image } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import ImageCard from "./ImageCard";
import { ClockArrowDown, ClockArrowUp, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import ImageDetailDialog from "./ImageDetailDialog";

interface Props {
  onSelect?: (ids: string[]) => void;
  selected?: string[];
}

export default function ImageGallery({ onSelect, selected }: Props) {
  const [images, setImages] = useState<Image[]>([]);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [uploading, setUploading] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user-images")
      .then((res) => res.json())
      .then(setImages);
  }, []);

  const lowerSearch = search.toLowerCase();
  const sortedImages = [...images]
    .filter((img) => {
      if (!lowerSearch) return true;
      return (
        img.title?.toLowerCase().includes(lowerSearch) ||
        img.originalFilename?.toLowerCase().includes(lowerSearch) ||
        img.description?.toLowerCase().includes(lowerSearch)
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sort === "desc" ? bDate - aDate : aDate - bDate;
    });

  const handleDelete = (id: string) =>
    setImages(images.filter((image) => image.id !== id));

  const handleClick = (imageId: string) => {
    if (onSelect) {
      if (selected?.includes(imageId)) {
        return onSelect(selected.filter((id) => id !== imageId));
      }
      if (!selected) {
        return onSelect([imageId]);
      }
      return onSelect([...selected, imageId]);
    }
    const idx = sortedImages.findIndex((img) => img.id === imageId);
    if (idx !== -1) setDetailIndex(idx);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          toast.error(`Upload fehlgeschlagen: ${file.name}`);
          continue;
        }

        const newImage = await res.json();
        setImages((prev) => [...prev, newImage]);
      } catch {
        toast.error(`Upload fehlgeschlagen: ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="flex gap-4 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <UploadCloud />
          )}
          {uploading ? "Wird hochgeladen..." : "Fotos hochladen"}
        </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Suche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-[200px]"
        />
        <div className="flex gap-2">
          <Button
            variant={sort === "desc" ? "default" : "outline"}
            onClick={() => setSort("desc")}
            type="button"
          >
            <ClockArrowDown />
            Neueste zuerst
          </Button>
          <Button
            variant={sort === "asc" ? "default" : "outline"}
            onClick={() => setSort("asc")}
            type="button"
          >
            <ClockArrowUp />
            Älteste zuerst
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedImages.map((image) => (
          <ImageCard
            key={image.id}
            isSelected={selected?.includes(image.id) ?? false}
            onClick={handleClick}
            onDelete={handleDelete}
            image={image}
          />
        ))}
      </div>

      <ImageDetailDialog
        image={detailIndex !== null ? sortedImages[detailIndex] : null}
        onClose={() => setDetailIndex(null)}
        onPrev={() => setDetailIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() =>
          setDetailIndex((i) =>
            i !== null && i < sortedImages.length - 1 ? i + 1 : i
          )
        }
        hasPrev={detailIndex !== null && detailIndex > 0}
        hasNext={detailIndex !== null && detailIndex < sortedImages.length - 1}
      />
    </>
  );
}
