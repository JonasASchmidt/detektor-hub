"use client";

import { useEffect, useState } from "react";
import { Image } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CldImage } from "next-cloudinary";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LinkedFinding {
  id: string;
  name: string | null;
}

type Stage = "confirm" | "linked" | "picking";

interface Props {
  image: Image;
  open: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function ImageDeleteDialog({ image, open, onClose, onDeleted }: Props) {
  const [stage, setStage] = useState<Stage>("confirm");
  const [linkedFindings, setLinkedFindings] = useState<LinkedFinding[]>([]);
  const [galleryImages, setGalleryImages] = useState<Image[]>([]);
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStage("confirm");
      setLinkedFindings([]);
      setGalleryImages([]);
      setReplacementId(null);
    }
  }, [open]);

  const doDelete = async (force: boolean, replacementImageId?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (force) params.set("force", "true");
    if (replacementImageId) params.set("replacementImageId", replacementImageId);

    const res = await fetch(`/api/images/${image.id}?${params}`, { method: "DELETE" });
    const data = await res.json();
    setLoading(false);

    if (res.status === 409 && data.error === "linked") {
      setLinkedFindings(data.linkedFindings);
      setStage("linked");
      return;
    }

    if (!res.ok) {
      toast.error(data.error || "Fehler beim Löschen.");
      return;
    }

    toast.success("Foto wurde gelöscht!");
    onDeleted(image.id);
    onClose();
  };

  const openPicker = async () => {
    const res = await fetch("/api/user-images");
    const imgs: Image[] = await res.json();
    setGalleryImages(imgs.filter((img) => img.id !== image.id));
    setStage("picking");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        {stage === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Foto löschen</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Soll dieses Foto wirklich gelöscht werden?</p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>Abbrechen</Button>
              <Button variant="destructive" disabled={loading} onClick={() => doDelete(false)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Löschen"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "linked" && (
          <>
            <DialogHeader>
              <DialogTitle>Foto ist einem Fund zugeordnet</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Dieses Foto ist folgenden Funden zugeordnet:</p>
              <ul className="list-disc list-inside font-medium text-foreground">
                {linkedFindings.map((f) => <li key={f.id}>{f.name || "Unbenannter Fund"}</li>)}
              </ul>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button className="w-full" onClick={openPicker}>Ersatzbild Auswählen</Button>
              <Button variant="destructive" className="w-full" disabled={loading} onClick={() => doDelete(true)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ohne Ersatz Löschen"}
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>Abbrechen</Button>
            </DialogFooter>
          </>
        )}

        {stage === "picking" && (
          <>
            <DialogHeader>
              <DialogTitle>Ersatzbild Auswählen</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setReplacementId(img.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${replacementId === img.id ? "border-foreground" : "border-transparent"}`}
                >
                  <CldImage
                    src={img.publicId}
                    width={120}
                    height={120}
                    crop="fill"
                    alt={img.originalFilename || ""}
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStage("linked")}>Zurück</Button>
              <Button disabled={!replacementId || loading} onClick={() => replacementId && doDelete(true, replacementId)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Übernehmen & Löschen"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
