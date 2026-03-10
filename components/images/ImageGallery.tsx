"use client";

import type { Image } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import ImageCard from "./ImageCard";
import { ClockArrowDown, ClockArrowUp, Loader2, UploadCloud, FolderTree, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import ImageDetailDialog from "./ImageDetailDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { FilterBar, SearchFilter, DateRangeFilter } from "../filters";

interface Props {
  onSelect?: (ids: string[]) => void;
  selected?: string[];
}

export default function ImageGallery({ onSelect, selected }: Props) {
  const [images, setImages] = useState<Image[]>([]);
  const [sort, setSort] = useState<"desc" | "asc" | "az" | "za" | "last_used">("desc");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveSelected = onSelect ? (selected || []) : internalSelected;
  const setEffectiveSelected = (ids: string[]) => {
    if (onSelect) onSelect(ids);
    else setInternalSelected(ids);
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/user-images")
      .then((res) => res.json())
      .then(setImages)
      .finally(() => setLoading(false));
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
      if (sort === "az") {
        return (a.title || a.originalFilename || "").localeCompare(b.title || b.originalFilename || "");
      }
      if (sort === "za") {
        return (b.title || b.originalFilename || "").localeCompare(a.title || a.originalFilename || "");
      }
      if (sort === "last_used") {
        // Mock fallback to updatedAt for 'last_used' if implemented later, right now acts as date descending like 'desc'
        const aDate = new Date(a.updatedAt || a.createdAt).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt).getTime();
        return bDate - aDate;
      }
      // default: desc/asc by createdAt
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sort === "desc" ? bDate - aDate : aDate - bDate;
    });

  const handleDelete = (id: string) =>
    setImages(images.filter((image) => image.id !== id));

  const handleSelectToggle = (id: string) => {
    const isSelected = effectiveSelected.includes(id);
    const newSelected = isSelected
      ? effectiveSelected.filter((i) => i !== id)
      : [...effectiveSelected, id];
    setEffectiveSelected(newSelected);
  };

  const handleClick = (imageId: string) => {
    if (onSelect) {
      handleSelectToggle(imageId);
    } else {
      if (effectiveSelected.length > 0) {
        handleSelectToggle(imageId);
      } else {
        const idx = sortedImages.findIndex((img) => img.id === imageId);
        if (idx !== -1) setDetailIndex(idx);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!effectiveSelected.length) return;
    if (!confirm(`${effectiveSelected.length} Bilder wirklich löschen?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/images/bulk", {
        method: "POST",
        body: JSON.stringify({ action: "delete", ids: effectiveSelected }),
      });
      if (res.ok) {
        setImages(images.filter((img) => !effectiveSelected.includes(img.id)));
        setEffectiveSelected([]);
        toast.success("Bilder gelöscht");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async () => {
    const folder = prompt("Name des Zielordners:", "Meine Funde");
    if (!folder) return;

    setLoading(true);
    try {
      const res = await fetch("/api/images/bulk", {
        method: "POST",
        body: JSON.stringify({ action: "move", ids: effectiveSelected, folder }),
      });
      if (res.ok) {
        toast.success(`In Ordner "${folder}" verschoben`);
        setEffectiveSelected([]);
        // Re-fetch to update folder field if needed, but not strictly required if UI doesn't show folders yet
      }
    } catch {
      toast.error("Fehler beim Verschieben");
    } finally {
      setLoading(false);
    }
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


      <div className="w-full mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          className="w-full h-8 border-2 border-foreground text-foreground hover:bg-zinc-800 hover:text-white hover:border-zinc-800 text-[13px] font-bold px-3 transition-all rounded-lg"
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          type="button"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <UploadCloud className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Wird hochgeladen..." : "Fotos hochladen"}
        </Button>
      </div>

      <FilterBar
        hasActiveFilters={!!(search || fileType !== "all" || dateFrom || dateTo)}
        onClearAll={() => {
          setSearch("");
          setFileType("all");
          setDateFrom("");
          setDateTo("");
        }}
        chips={
          (search || fileType !== "all" || dateFrom || dateTo) ? (
            <>
              {search && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
                  Suche: {search}
                  <button onClick={() => setSearch("")} className="hover:text-primary">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {fileType !== "all" && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
                  Typ: {fileType.toUpperCase()}
                  <button onClick={() => setFileType("all")} className="hover:text-primary">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
                  {dateFrom && `ab ${dateFrom}`} {dateTo && `bis ${dateTo}`}
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="hover:text-primary">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </>
          ) : null
        }
      >
        <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5">
          <SearchFilter
            placeholder="Suche..."
            value={search}
            onChange={(v) => setSearch(v || "")}
            className="h-8 min-w-[150px] flex-1"
          />

          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="w-[70px] h-8 bg-white border-2 px-2 text-[13px]">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Typ</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WEBP</SelectItem>
            </SelectContent>
          </Select>

          <DateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={(v) => setDateFrom(v || "")}
            onDateToChange={(v) => setDateTo(v || "")}
            onClear={() => { setDateFrom(""); setDateTo(""); }}
            label="Datum"
          />
        </div>
      </FilterBar>

      <div className="flex flex-col gap-2 pt-2 px-1">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold">
            {sortedImages.length} {sortedImages.length === 1 ? "Bild" : "Bilder"}
          </h2>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-[110px] h-8 bg-white border-2 px-2 text-[12px] font-bold rounded-lg shadow-sm">
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Neu zuerst</SelectItem>
              <SelectItem value="asc">Alt zuerst</SelectItem>
              <SelectItem value="az">Name A-Z</SelectItem>
              <SelectItem value="za">Name Z-A</SelectItem>
              <SelectItem value="last_used">Zuletzt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {effectiveSelected.length > 0 ? (
          <div className="flex items-center justify-between p-2 bg-zinc-50 border-2 border-zinc-200/50 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-zinc-900 ml-1">
                {effectiveSelected.length} ausgewählt
              </span>
              <div className="h-4 w-[1px] bg-zinc-300" />
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-zinc-500 hover:text-zinc-900 text-[12px] px-2"
                onClick={() => setEffectiveSelected(sortedImages.map(img => img.id))}
              >
                Alle wählen
              </Button>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 rounded-lg border-2 border-foreground/5 text-foreground hover:bg-zinc-800 hover:text-white transition-all text-[12px] font-bold px-3"
                onClick={handleBulkMove}
              >
                <FolderTree className="h-3.5 w-3.5 mr-1.5" /> Verschieben
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 rounded-lg border-2 border-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-[12px] font-bold px-3"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Löschen
              </Button>
              <div className="h-4 w-[1px] bg-zinc-300 mx-1" />
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-zinc-200"
                onClick={() => setEffectiveSelected([])}
                title="Abbrechen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-[2px]" /> // Placeholder for space
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))
        ) : sortedImages.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-muted rounded-2xl bg-muted/20">
            <p className="text-muted-foreground font-medium">Du hast noch keine Bilder hochgeladen.</p>
            {(search || fileType !== "all" || dateFrom || dateTo) && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Passen Sie Ihre Filter an, um andere Ergebnisse zu sehen.
              </p>
            )}
          </div>
        ) : (
          sortedImages.map((image) => (
            <ImageCard
              key={image.id}
              isSelected={effectiveSelected.includes(image.id)}
              onClick={handleClick}
              onSelectToggle={handleSelectToggle}
              onDelete={handleDelete}
              image={image}
            />
          ))
        )}
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
