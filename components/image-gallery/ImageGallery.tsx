"use client";

import { Image } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import ImageCard from "./ImageCard";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import ImageDetailDialog from "./ImageDetailDialog";
import { SelectFilter } from "@/components/filters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const sortOptions = [
  { value: "desc", label: "Neueste zuerst" },
  { value: "asc", label: "Älteste zuerst" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

interface Props {
  onSelect?: (ids: string[]) => void;
  selected?: string[];
}

export default function ImageGallery({ onSelect, selected }: Props) {
  const [images, setImages] = useState<Image[]>([]);
  const [sort, setSort] = useState("desc");
  const [uploading, setUploading] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user-images")
      .then((res) => res.json())
      .then(setImages);
  }, []);

  const lowerSearch = search.toLowerCase();
  const sortedImages = [...images]
    .filter((img) => {
      let match = true;
      if (lowerSearch) {
        match = Boolean(
          img.title?.toLowerCase().includes(lowerSearch) ||
          img.originalFilename?.toLowerCase().includes(lowerSearch) ||
          img.description?.toLowerCase().includes(lowerSearch)
        );
      }

      if (match && fileType !== "all" && img.originalFilename) {
        const ext = img.originalFilename.split(".").pop()?.toLowerCase();
        if (fileType === "jpg") match = ext === "jpg" || ext === "jpeg";
        else match = ext === fileType;
      }

      if (match && dateFrom) {
        if (new Date(img.createdAt) < new Date(dateFrom)) match = false;
      }

      if (match && dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(img.createdAt) > toDate) match = false;
      }

      return match;
    })
    .sort((a, b) => {
      if (sort === "az") return (a.title || a.originalFilename || "").localeCompare(b.title || b.originalFilename || "");
      if (sort === "za") return (b.title || b.originalFilename || "").localeCompare(a.title || a.originalFilename || "");
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sort === "desc" ? bDate - aDate : aDate - bDate;
    });

  const handleDelete = (id: string) =>
    setImages(images.filter((image) => image.id !== id));

  const handleClick = (imageId: string) => {
    if (onSelect) {
      if (selected?.includes(imageId)) return onSelect(selected.filter((id) => id !== imageId));
      if (!selected) return onSelect([imageId]);
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
        const res = await fetch("/api/images", { method: "POST", body: formData });
        if (!res.ok) { toast.error(`Upload fehlgeschlagen: ${file.name}`); continue; }
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
          className="w-full h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] px-3 transition-all duration-150 ease-in-out"
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          type="button"
          disabled={uploading}
        >
          {uploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
          {uploading ? "Wird hochgeladen..." : "Fotos hochladen"}
        </Button>
      </div>

      {images.length > 0 && (
        <div className="bg-muted rounded-lg border border-border">
          <div className="flex flex-nowrap gap-3 p-4 items-center overflow-x-auto [&_input]:bg-white [&_button]:bg-white [&_[role=combobox]]:bg-white">
            <Input
              placeholder="Suche nach Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[80px] h-9"
            />
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="w-[120px] h-9 shrink-0 bg-white">
                <SelectValue placeholder="Dateityp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="jpg">JPG / JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WEBP</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto h-9 shrink-0"
              title="Datum von"
            />
            <span className="text-muted-foreground text-sm shrink-0">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto h-9 shrink-0"
              title="Datum bis"
            />
          </div>
        </div>
      )}

      {sortedImages.length > 0 && (
        <div className="!mt-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{sortedImages.length} Bilder</h2>
            <SelectFilter
              value={sort}
              onChange={setSort}
              options={sortOptions}
              placeholder="Sortieren"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 rounded-lg overflow-hidden">
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
        </div>
      )}

      <ImageDetailDialog
        image={detailIndex !== null ? sortedImages[detailIndex] : null}
        onClose={() => setDetailIndex(null)}
        onPrev={() => setDetailIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() => setDetailIndex((i) => i !== null && i < sortedImages.length - 1 ? i + 1 : i)}
        hasPrev={detailIndex !== null && detailIndex > 0}
        hasNext={detailIndex !== null && detailIndex < sortedImages.length - 1}
      />
    </>
  );
}
