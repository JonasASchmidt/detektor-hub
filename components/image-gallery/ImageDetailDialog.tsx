"use client";

import { useState, useEffect } from "react";
import { Image } from "@prisma/client";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent } from "../ui/dialog";
import { toast } from "sonner";

interface Props {
  image: Image | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageDetailDialog({ image, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(image?.title ?? "");
    setDescription(image?.description ?? "");
  }, [image?.id]);

  if (!image) return null;

  const fullUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${image.publicId}`;

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setSaving(false);
    if (res.ok) toast.success("Änderungen gespeichert.");
    else toast.error("Fehler beim Speichern.");
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
