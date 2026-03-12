"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/ui/input/date-picker";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fieldSessionSchema, FieldSessionFormData } from "@/schemas/field-session";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Detector } from "@prisma/client";

const ZonePickerMap = dynamic(() => import("@/components/map/zone-picker-map"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted animate-pulse rounded-lg" />,
});

/** Convert Leaflet [lat,lng][] to a GeoJSON Polygon string (lng,lat order for GeoJSON) */
function toGeoJSON(coords: [number, number][]): string {
  if (coords.length < 3) return "";
  const ring = [...coords.map(([lat, lng]) => [lng, lat]), [coords[0][1], coords[0][0]]];
  return JSON.stringify({ type: "Polygon", coordinates: [ring] });
}

/** Convert a GeoJSON Polygon string back to Leaflet [lat,lng][] */
function fromGeoJSON(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson);
    const ring: [number, number][] = parsed.coordinates[0];
    // Drop the closing point (same as first)
    return ring.slice(0, -1).map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

interface Props {
  detectors: Detector[];
  /** When provided, the form is in edit mode */
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    dateFrom: Date | string;
    dateTo?: Date | string | null;
    zone?: string | null; // GeoJSON string
    detectorId?: string | null;
  };
}

export default function SessionForm({ detectors, initialData }: Props) {
  const isEdit = !!initialData;
  const router = useRouter();

  const [zoneCoords, setZoneCoords] = useState<[number, number][] | null>(() => {
    if (initialData?.zone) return fromGeoJSON(initialData.zone);
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { control, register, handleSubmit, watch, formState: { errors } } =
    useForm<FieldSessionFormData>({
      resolver: zodResolver(fieldSessionSchema),
      defaultValues: {
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        dateFrom: initialData?.dateFrom ? new Date(initialData.dateFrom) : undefined,
        dateTo: initialData?.dateTo ? new Date(initialData.dateTo) : null,
        detectorId: initialData?.detectorId ?? "",
      },
    });

  const watchName = watch("name");

  const onSubmit: SubmitHandler<FieldSessionFormData> = async (data) => {
    setLoading(true);

    const zone =
      zoneCoords && zoneCoords.length >= 3 ? toGeoJSON(zoneCoords) : null;

    const payload = { ...data, zone, detectorId: data.detectorId || null };

    const res = await fetch(
      isEdit ? `/api/field-sessions/${initialData!.id}` : "/api/field-sessions",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);

    if (!res.ok) {
      toast.error("Begehung konnte nicht gespeichert werden.");
      return;
    }

    toast.success(isEdit ? "Begehung aktualisiert!" : "Neue Begehung angelegt!");
    router.push("/dashboard/sessions");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm("Begehung wirklich löschen? Die zugehörigen Funde bleiben erhalten.")) return;

    setDeleting(true);
    const res = await fetch(`/api/field-sessions/${initialData.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      toast.error("Begehung konnte nicht gelöscht werden.");
      return;
    }

    toast.success("Begehung gelöscht.");
    router.push("/dashboard/sessions");
    router.refresh();
  };

  return (
    <>
      <h1 className="text-4xl font-bold truncate mb-3" title={watchName || (isEdit ? "Begehung bearbeiten" : "Neue Begehung")}>
        {watchName || (isEdit ? "Begehung bearbeiten" : "Neue Begehung")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card className="bg-white dark:bg-gray-900 border border-border">
          <div className="py-6 px-6 space-y-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="z. B. Äcker bei Mühlhausen"
                {...register("name", { required: true })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Beschreibung */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Notizen zur Begehung, Bodenbeschaffenheit, Wetterbedingungen …"
                rows={3}
                {...register("description")}
              />
            </div>

            {/* Dates */}
            <div className="flex flex-row flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <Label>Datum (von)</Label>
                <DatePicker
                  control={control}
                  name="dateFrom"
                  rules={{ required: true }}
                  placeholder="TT.MM.JJJJ"
                />
                {errors.dateFrom && (
                  <p className="text-xs text-destructive">{errors.dateFrom.message as string}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Datum (bis, optional)</Label>
                <DatePicker
                  control={control}
                  name="dateTo"
                  placeholder="TT.MM.JJJJ"
                />
                {errors.dateTo && (
                  <p className="text-xs text-destructive">{errors.dateTo.message as string}</p>
                )}
              </div>
            </div>

            {/* Detector */}
            {detectors.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detectorId">Verwendetes Gerät (optional)</Label>
                <select
                  id="detectorId"
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  {...register("detectorId")}
                >
                  <option value="">— kein Gerät ausgewählt —</option>
                  {detectors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.company} {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Zone picker */}
        <Card className="bg-white dark:bg-gray-900 border border-border">
          <div className="py-4 px-6 space-y-3">
            <div>
              <p className="text-xl font-bold">Suchzone</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Klicke auf die Karte um das Suchgebiet als Polygon einzuzeichnen.
              </p>
            </div>
            <ZonePickerMap
              value={zoneCoords ?? undefined}
              onChange={(coords) => setZoneCoords(coords)}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            variant="ghost"
            size="lg"
            className="flex-1 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold px-3 transition-all duration-150 ease-in-out"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Bitte warten</>
            ) : isEdit ? (
              "Änderungen speichern"
            ) : (
              "Begehung speichern"
            )}
          </Button>

          {isEdit && (
            <Button
              type="button"
              disabled={deleting}
              variant="ghost"
              size="lg"
              onClick={handleDelete}
              className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white font-bold px-3 transition-all duration-150 ease-in-out"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
