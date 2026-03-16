"use client";

import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applyNamingScheme } from "@/lib/namingScheme";

interface ActiveSession {
  id: string;
  name: string;
  namingScheme: string | null;
}

interface Props {
  activeSession: ActiveSession | null;
  onFindSubmitted?: () => void;
}

interface GpsState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

interface UploadedImage {
  id: string;
  url: string;
}

export default function QuickFindForm({ activeSession, onFindSubmitted }: Props) {
  const [gps, setGps] = useState<GpsState>({
    lat: null,
    lng: null,
    accuracy: null,
    loading: false,
    error: null,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conductivity, setConductivity] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmit, setLastSubmit] = useState<string | null>(null);
  // Track how many finds have been submitted this session for the name preview
  const [sessionFindCount, setSessionFindCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoName = useMemo(() => {
    if (!activeSession?.namingScheme) return null;
    return applyNamingScheme(
      activeSession.namingScheme,
      activeSession.name,
      sessionFindCount + 1
    );
  }, [activeSession, sessionFindCount]);

  function fetchGps() {
    if (!navigator.geolocation) {
      setGps((prev) => ({
        ...prev,
        error: "GPS wird nicht unterstützt.",
      }));
      return;
    }
    setGps((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          loading: false,
          error: null,
        });
      },
      (err) => {
        setGps((prev) => ({
          ...prev,
          loading: false,
          error: `GPS-Fehler: ${err.message}`,
        }));
      },
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/images", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const img = await res.json();
      setImages((prev) => [...prev, { id: img.id, url: img.url }]);
    } catch {
      toast.error("Bild konnte nicht hochgeladen werden.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gps.lat || !gps.lng) {
      toast.error("Bitte zuerst GPS-Koordinaten abrufen.");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim() || undefined,
      location: { lat: gps.lat, lng: gps.lng },
      description: description || undefined,
      conductivity: conductivity ? parseInt(conductivity, 10) : undefined,
      foundAt: new Date().toISOString(),
      images: images.map((i) => i.id),
      fieldSessionId: activeSession?.id ?? null,
    };

    try {
      const res = await fetch("/api/findings/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const { finding } = await res.json();

      const savedName = finding.name ?? null;
      toast.success(savedName ? `Fund „${savedName}" gespeichert` : "Fund gespeichert");
      setLastSubmit(savedName);
      setSessionFindCount((c) => c + 1);
      onFindSubmitted?.();

      // Reset form (keep GPS coords for rapid successive finds)
      setName("");
      setDescription("");
      setConductivity("");
      setImages([]);
    } catch {
      toast.error("Fund konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasCoords = gps.lat !== null && gps.lng !== null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="findName">Name</Label>
        <Input
          id="findName"
          placeholder={autoName ?? "Fund benennen …"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base"
        />
        {autoName && !name && (
          <p className="text-xs text-muted-foreground">
            Leer lassen für automatischen Name:{" "}
            <span className="font-medium text-foreground">{autoName}</span>
          </p>
        )}
      </div>

      {/* GPS */}
      <div className="flex flex-col gap-2">
        <Label>Standort</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchGps}
            disabled={gps.loading}
            className="flex-1 h-12 text-base"
          >
            {gps.loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Crosshair className="h-4 w-4 mr-2" />
            )}
            {hasCoords ? "Aktualisieren" : "GPS abrufen"}
          </Button>
          {hasCoords && (
            <div className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="font-mono text-xs">
                {gps.lat!.toFixed(5)}, {gps.lng!.toFixed(5)}
              </span>
            </div>
          )}
        </div>
        {gps.accuracy !== null && (
          <p className="text-xs text-muted-foreground">
            Genauigkeit: ±{gps.accuracy} m
          </p>
        )}
        {gps.error && (
          <p className="text-xs text-destructive">{gps.error}</p>
        )}
      </div>

      {/* Camera / image */}
      <div className="flex flex-col gap-2">
        <Label>Fotos</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageSelect}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="h-12 text-base"
          >
            {uploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Foto aufnehmen
          </Button>
          {images.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt="Fundfoto"
                className="h-12 w-12 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Conductivity */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="conductivity">Leitfähigkeit</Label>
        <Input
          id="conductivity"
          type="number"
          inputMode="numeric"
          placeholder="z. B. 72"
          value={conductivity}
          onChange={(e) => setConductivity(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          placeholder="Erste Einschätzung, Bodenbeschaffenheit, Besonderheiten …"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="text-base"
        />
      </div>

      {/* Last saved indicator */}
      {lastSubmit !== null && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Zuletzt gespeichert:{" "}
          <span className="font-medium">{lastSubmit || "Draft"}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={submitting || !hasCoords}
        className={cn(
          "h-14 text-base font-bold mt-2",
          !hasCoords && "opacity-50"
        )}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : null}
        Fund loggen
      </Button>
    </form>
  );
}
