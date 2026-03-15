"use client";

import type { Image, Tag } from "@prisma/client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "../ui/button";
import ImageCard from "./ImageCard";
import { Loader2, UploadCloud, FolderTree, Trash2, X, Images } from "lucide-react";
import { toast } from "sonner";
import ImageDetailDialog from "./ImageDetailDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { FilterBar, SearchFilter, DateRangeFilter, SelectFilter } from "../filters";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tag as TagIcon } from "lucide-react";

export interface ImageGalleryHandle {
  triggerUpload: () => void;
}

type ImageWithTags = Image & { tags?: Tag[] };

interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

interface Props {
  onSelect?: (ids: string[]) => void;
  selected?: string[];
  onUpload?: (image: ImageWithTags) => void;
}

const ImageGallery = forwardRef<ImageGalleryHandle, Props>(function ImageGallery({ onSelect, selected, onUpload }: Props, ref) {
  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [sort, setSort] = useState<"desc" | "asc" | "az" | "za" | "last_used">("desc");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => fileInputRef.current?.click(),
  }));

  const effectiveSelected = onSelect ? (selected || []) : internalSelected;
  const setEffectiveSelected = (ids: string[]) => {
    if (onSelect) onSelect(ids);
    else setInternalSelected(ids);
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/user-images")
      .then((res) => res.ok ? res.json() : [])
      .then(setImages)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/tag-categories")
      .then((res) => res.json())
      .then(setTagCategories)
      .catch(() => {});
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

      if (match && selectedTagIds.length > 0) {
        const imgTagIds = img.tags?.map((t) => t.id) ?? [];
        match = selectedTagIds.every((tid) => imgTagIds.includes(tid));
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
    setImages((prev) => prev.filter((image) => image.id !== id));

  const handleUpdate = (updated: ImageWithTags) =>
    setImages((prev) => prev.map((img) => img.id === updated.id ? updated : img));

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
        onUpload?.(newImage);
      } catch {
        toast.error(`Upload fehlgeschlagen: ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasAnyImages = images.length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {!loading && !hasAnyImages ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Images className="h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-2xl font-bold">Noch keine Bilder</h2>
          <p className="text-sm text-muted-foreground">Lade dein erstes Foto hoch, um deine Funde zu dokumentieren.</p>
          <Button className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
            {uploading ? "Wird hochgeladen..." : "Fotos hochladen"}
          </Button>
        </div>
      ) : !loading && (
      <>
      <FilterBar
        hasActiveFilters={!!(search || fileType !== "all" || dateFrom || dateTo || selectedTagIds.length > 0)}
        onClearAll={() => {
          setSearch("");
          setFileType("all");
          setDateFrom("");
          setDateTo("");
          setSelectedTagIds([]);
        }}
        chips={
          (search || fileType !== "all" || dateFrom || dateTo || selectedTagIds.length > 0) ? (
            <>
              {search && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
                  Suche: {search}
                  <button onClick={() => setSearch("")} className="group !bg-transparent rounded-full p-0.5">
                    <X className="h-3 w-3 text-black/50 group-hover:text-black transition-colors" />
                  </button>
                </span>
              )}
              {fileType !== "all" && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
                  Typ: {fileType.toUpperCase()}
                  <button onClick={() => setFileType("all")} className="group !bg-transparent rounded-full p-0.5">
                    <X className="h-3 w-3 text-black/50 group-hover:text-black transition-colors" />
                  </button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-primary/10 text-sm font-medium">
                  {dateFrom && `ab ${dateFrom}`} {dateTo && `bis ${dateTo}`}
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="group !bg-transparent rounded-full p-0.5">
                    <X className="h-3 w-3 text-black/50 group-hover:text-black transition-colors" />
                  </button>
                </span>
              )}
              {selectedTagIds.map((tid) => {
                const tag = tagCategories.flatMap((c) => c.tags).find((t) => t.id === tid);
                if (!tag) return null;
                return (
                  <span key={tid} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-sm font-medium text-white" style={{ backgroundColor: tag.color }}>
                    {tag.name}
                    <button onClick={() => setSelectedTagIds((prev) => prev.filter((i) => i !== tid))} className="group !bg-transparent rounded-full p-0.5">
                      <X className="h-3 w-3 text-white/50 group-hover:text-white transition-colors" />
                    </button>
                  </span>
                );
              })}
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
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
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

          {tagCategories.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 h-8 px-2.5 text-[13px] font-medium rounded-lg border-2 bg-white transition-colors ${selectedTagIds.length > 0 ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-foreground"}`}
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  Tags{selectedTagIds.length > 0 ? ` (${selectedTagIds.length})` : ""}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <div className="max-h-56 overflow-y-auto py-1">
                  {tagCategories.map((cat) => (
                    <div key={cat.id}>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {cat.name}
                      </div>
                      {cat.tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setSelectedTagIds((prev) => active ? prev.filter((i) => i !== tag.id) : [...prev, tag.id])}
                            className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors ${active ? "bg-accent font-medium" : ""}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                            <span className="flex-1 text-left">{tag.name}</span>
                            {active && <X className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </FilterBar>

      <div className="!mt-12 flex flex-col gap-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">
            {sortedImages.length} {sortedImages.length === 1 ? "Bild" : "Bilder"}
          </h2>
          <SelectFilter
            value={sort}
            onChange={(v) => setSort(v as any)}
            options={[
              { value: "desc", label: "Neueste zuerst" },
              { value: "asc", label: "Älteste zuerst" },
              { value: "az", label: "A-Z" },
              { value: "za", label: "Z-A" },
            ]}
            placeholder="Sortieren"
          />
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

      <div className="!mt-[6px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))
        ) : sortedImages.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-3">
            <Images className="h-10 w-10 text-muted-foreground/50" />
            <h2 className="text-2xl font-bold">Keine Bilder gefunden</h2>
            <p className="text-sm text-muted-foreground">Deine Filter ergeben keine Treffer.</p>
            <Button variant="outline" className="mt-2" onClick={() => { setSearch(""); setFileType("all"); setDateFrom(""); setDateTo(""); setSelectedTagIds([]); }}>
              Filter zurücksetzen
            </Button>
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

      </>
      )}
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
        onDelete={(id) => { handleDelete(id); setDetailIndex(null); }}
        onUpdate={handleUpdate}
      />
    </>
  );
});

export default ImageGallery;
