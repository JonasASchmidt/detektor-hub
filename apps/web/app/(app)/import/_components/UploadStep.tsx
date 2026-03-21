"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileIcon, ImageIcon, Loader2, UploadIcon } from "lucide-react";
import { parseGpxFile } from "./parsers/parseGpx";
import { parseGeotaggedImages } from "./parsers/parseImages";
import type { ParsedImport } from "./parsers/types";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".gpx", ".kml", ".jpg", ".jpeg", ".png", ".heic", ".heif"];
const ACCEPTED_MIME = "image/jpeg,image/png,image/heic,image/heif,.gpx,.kml";

interface Props {
  onParsed: (result: ParsedImport, fileName: string) => void;
}

export default function UploadStep({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      const fileArray = Array.from(files);
      const ext = fileArray[0].name.split(".").pop()?.toLowerCase() ?? "";

      // Multiple files → must all be images (geotagged photo import)
      if (fileArray.length > 1) {
        const imageFiles = fileArray.filter((f) =>
          ["jpg", "jpeg", "png", "heic", "heif"].includes(
            f.name.split(".").pop()?.toLowerCase() ?? ""
          )
        );
        if (imageFiles.length === 0) {
          setError("Für Mehrfachauswahl sind nur Bilddateien erlaubt.");
          setLoading(false);
          return;
        }
        const result = await parseGeotaggedImages(imageFiles);
        if (result.findings.length === 0) {
          setError(
            `Keine GPS-Daten in den Bildern gefunden.${
              result.skipped > 0
                ? ` ${result.skipped} Bild${result.skipped > 1 ? "er" : ""} ohne Standort übersprungen.`
                : ""
            }`
          );
          setLoading(false);
          return;
        }
        onParsed(result, `${imageFiles.length} Bilder`);
        return;
      }

      // Single file dispatch by extension
      const file = fileArray[0];

      if (ext === "gpx") {
        const text = await file.text();
        const result = parseGpxFile(text);
        if (result.sessions.length === 0 && result.findings.length === 0) {
          setError("Keine Begehungen oder Funde in der GPX-Datei gefunden.");
          setLoading(false);
          return;
        }
        onParsed(result, file.name);
        return;
      }

      if (ext === "kml") {
        setError("KML-Import folgt in Kürze. Bitte GPX-Datei verwenden.");
        setLoading(false);
        return;
      }

      if (["jpg", "jpeg", "png", "heic", "heif"].includes(ext)) {
        const result = await parseGeotaggedImages([file]);
        if (result.findings.length === 0) {
          setError("Kein GPS-Standort in diesem Bild gefunden.");
          setLoading(false);
          return;
        }
        onParsed(result, file.name);
        return;
      }

      setError(`Dateiformat .${ext} wird nicht unterstützt.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Datei konnte nicht gelesen werden."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Drop zone */}
      <div
        className={cn(
          "w-full border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors",
          dragging
            ? "border-foreground bg-zinc-100"
            : "border-border hover:border-foreground hover:bg-zinc-50"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <UploadIcon className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="font-medium">
            {loading ? "Wird verarbeitet …" : "Datei hierher ziehen oder klicken"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            GPX, KML — oder Fotos mit GPS (JPG, PNG, HEIC)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Format hints */}
      <div className="grid grid-cols-2 gap-3 w-full text-sm text-muted-foreground">
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-3">
          <FileIcon className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground">GPX / KML</p>
            <p>GoTerrain, Garmin, Google Maps</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-3">
          <ImageIcon className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Geo-Fotos</p>
            <p>JPG, PNG, HEIC mit GPS</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Unterstützte Formate: {ACCEPTED_EXTENSIONS.join(", ")}
      </p>
    </div>
  );
}
