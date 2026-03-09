"use client";

import { Image } from "@prisma/client";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
} from "../ui/dialog";

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

export default function ImageDetailDialog({
  image,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  if (!image) return null;

  const fullUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${image.publicId}`;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 gap-0 overflow-hidden">
        <div className="relative flex flex-col max-h-[95vh]">
          {/* Image area */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black/5 dark:bg-black/20">
            {hasPrev && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}

            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-zoom-in"
            >
              <CldImage
                src={image.publicId}
                width={1600}
                height={1200}
                alt={image.title || "Bild"}
                className="max-w-[90vw] max-h-[75vh] object-contain"
              />
            </a>

            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Metadata bar */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1 min-w-0">
              {image.originalFilename && (
                <span className="truncate max-w-48">{image.originalFilename}</span>
              )}
              <span>{format(new Date(image.createdAt), "dd.MM.yyyy, HH:mm")} Uhr</span>
              {image.fileSize && <span>{formatFileSize(image.fileSize)}</span>}
              {image.width && image.height && (
                <span>{image.width} × {image.height} px</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  disabled={!hasPrev}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNext}
                  disabled={!hasNext}
                >
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Original
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
