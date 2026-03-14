"use client";

import { useState, useEffect } from "react";
import { Image, Tag } from "@prisma/client";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink, Tag as TagIcon, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { toast } from "sonner";

type ImageWithTags = Image & { tags?: Tag[] };

interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

interface Props {
  image: ImageWithTags | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (updatedImage: ImageWithTags) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageDetailDialog({ image, onClose, onPrev, onNext, hasPrev, hasNext, onDelete, onUpdate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tag-categories")
      .then((r) => r.json())
      .then(setTagCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setTitle(image?.title ?? "");
    setDescription(image?.description ?? "");
    setTagIds(image?.tags?.map((t) => t.id) ?? []);
  }, [image?.id]);

  if (!image) return null;

  const fullUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${image.publicId}`;

  const allTags = tagCategories.flatMap((c) => c.tags);
  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));
  const filteredCategories = tagCategories
    .map((cat) => ({
      ...cat,
      tags: cat.tags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase())),
    }))
    .filter((cat) => cat.tags.length > 0);

  const toggleTag = (id: string) => {
    setTagIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, tags: tagIds }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Änderungen gespeichert.");
      if (onUpdate) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } else {
      toast.error("Fehler beim Speichern.");
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-row">

        {/* Left: image */}
        <div className="relative flex-1 min-w-0 flex items-center justify-center bg-foreground/5">
          {hasPrev && (
            <Button variant="ghost" size="icon" onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="cursor-zoom-in flex items-center justify-center w-full h-full p-4">
            <CldImage
              src={image.publicId}
              width={1600}
              height={1200}
              alt={image.title || "Bild"}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </a>
          {hasNext && (
            <Button variant="ghost" size="icon" onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background">
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Right: edit panel */}
        <div className="w-72 shrink-0 border-l flex flex-col overflow-y-auto">
          <div className="flex-1 p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="img-title">Titel</Label>
              <Input id="img-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="img-desc">Beschreibung</Label>
              <Input id="img-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung…" />
            </div>

            {/* Tag picker */}
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                      <TagIcon className="h-3.5 w-3.5" />
                      Tags{tagIds.length > 0 ? ` (${tagIds.length})` : ""}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-0" align="start" collisionPadding={8}>
                    <div className="p-2 border-b">
                      <Input
                        className="h-7 text-xs"
                        placeholder="Tags suchen…"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {filteredCategories.map((cat) => (
                        <div key={cat.id}>
                          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {cat.name}
                          </div>
                          {cat.tags.map((tag) => {
                            const active = tagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors ${active ? "bg-accent font-medium" : ""}`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color ?? "#888" }} />
                                <span className="flex-1 text-left">{tag.name}</span>
                                {active && <X className="h-3 w-3 text-muted-foreground shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                      {filteredCategories.length === 0 && (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">Keine Tags gefunden</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color ?? "#888" }}
                  >
                    {tag.name}
                    <button type="button" onClick={() => toggleTag(tag.id)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-1 text-sm text-muted-foreground">
              {image.originalFilename && <p className="truncate" title={image.originalFilename}>{image.originalFilename}</p>}
              <p>{format(new Date(image.createdAt), "dd.MM.yyyy, HH:mm")} Uhr</p>
              {image.fileSize && <p>{formatFileSize(image.fileSize)}</p>}
              {image.width && image.height && <p>{image.width} × {image.height} px</p>}
            </div>
          </div>

          <div className="p-4 border-t space-y-2">
            <Button className="w-full font-bold" disabled={saving} onClick={handleSave}>
              {saving ? "Speichert…" : "Änderungen Speichern"}
            </Button>
            {onDelete && (
              <Button variant="destructive" className="w-full" onClick={async () => {
                const res = await fetch(`/api/images/${image.id}`, { method: "DELETE" });
                if (res.ok) { onDelete(image.id); onClose(); toast.success("Foto gelöscht."); }
                else toast.error("Fehler beim Löschen.");
              }}>
                <Trash2 className="w-4 h-4 mr-2" /> Foto löschen
              </Button>
            )}
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={onPrev} disabled={!hasPrev}>
                <ChevronLeft className="w-4 h-4" /> Zurück
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={onNext} disabled={!hasNext}>
                Weiter <ChevronRight className="w-4 h-4" />
              </Button>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4" /></Button>
              </a>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
