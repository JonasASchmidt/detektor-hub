"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Image } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  image: Image;
  onChange: (image: Image) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageEditor({ image, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(image.title ?? "");
  const [description, setDescription] = useState(image.description ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || null, description: description || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Fehler beim Speichern.");
        return;
      }
      const updated = await res.json();
      onChange(updated);
      toast.success("Änderungen gespeichert.");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bild Bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Titel
            </Label>
            <Input
              id="name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Beschreibung
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
          <h4 className="font-medium text-foreground">Dateiinformationen</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Dateiname</span>
            <span className="truncate">{image.originalFilename ?? "–"}</span>
            <span>Hochgeladen</span>
            <span>{format(new Date(image.createdAt), "dd.MM.yyyy, HH:mm")} Uhr</span>
            <span>Dateigröße</span>
            <span>{formatFileSize(image.fileSize)}</span>
            <span>Auflösung</span>
            <span>
              {image.width && image.height
                ? `${image.width} × ${image.height} px`
                : "–"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Wird gespeichert..." : "Änderungen speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
