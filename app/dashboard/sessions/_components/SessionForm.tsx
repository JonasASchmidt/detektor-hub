"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/ui/input/date-picker";
import { Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fieldSessionSchema, FieldSessionFormData } from "@/schemas/field-session";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Detector } from "@prisma/client";
import FindingsPicker from "./FindingsPicker";
import ZonePicker from "./ZonePicker";
import { useZonePicker } from "./useZonePicker";
import { pointInPolygon } from "@/lib/geo";
import { applyNamingScheme } from "@/lib/namingScheme";

export interface FindingOption {
  id: string;
  name: string | null;
  foundAt: Date | string;
  latitude: number;
  longitude: number;
  fieldSessionId: string | null;
}

interface Props {
  detectors: Detector[];
  allFindings: FindingOption[];
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    namingScheme?: string | null;
    dateFrom: Date | string;
    dateTo?: Date | string | null;
    zoneId?: string | null;
    detectorId?: string | null;
    findingIds?: string[];
  };
}

export default function SessionForm({ detectors, allFindings, initialData }: Props) {
  const isEdit = !!initialData;
  const router = useRouter();

  const zone = useZonePicker(initialData?.zoneId);

  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(
    () => new Set(initialData?.findingIds ?? [])
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { control, register, handleSubmit, watch, formState: { errors } } =
    useForm<FieldSessionFormData>({
      resolver: zodResolver(fieldSessionSchema),
      defaultValues: {
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        namingScheme: initialData?.namingScheme ?? "",
        dateFrom: initialData?.dateFrom ? new Date(initialData.dateFrom) : undefined,
        dateTo: initialData?.dateTo ? new Date(initialData.dateTo) : null,
        detectorId: initialData?.detectorId ?? "",
        zoneId: initialData?.zoneId ?? "",
      },
    });

  const watchName = watch("name");
  const watchNamingScheme = watch("namingScheme");
  const dateFrom = useWatch({ control, name: "dateFrom" });
  const dateTo = useWatch({ control, name: "dateTo" });

  const namingPreview = useMemo(() => {
    if (!watchNamingScheme || !watchName) return null;
    try {
      return applyNamingScheme(watchNamingScheme, watchName || "Session", 1);
    } catch {
      return null;
    }
  }, [watchNamingScheme, watchName]);

  const filteredFindings = useMemo(() => {
    const hasZone = zone.activeZoneCoords && zone.activeZoneCoords.length >= 3;
    const hasFilter = hasZone || !!dateFrom || !!dateTo;
    if (!hasFilter) return allFindings;

    return allFindings.filter((f) => {
      const date = new Date(f.foundAt);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo)) return false;
      if (hasZone && !pointInPolygon(f.latitude, f.longitude, zone.activeZoneCoords!)) return false;
      return true;
    });
  }, [allFindings, zone.activeZoneCoords, dateFrom, dateTo]);

  const onSubmit: SubmitHandler<FieldSessionFormData> = async (data) => {
    setLoading(true);
    let resolvedZoneId: string | null;
    try {
      resolvedZoneId = await zone.resolveZoneId();
    } catch {
      setLoading(false);
      return;
    }

    const payload = {
      ...data,
      zoneId: resolvedZoneId,
      detectorId: data.detectorId || null,
      findingIds: Array.from(selectedFindingIds),
    };

    const res = await fetch(
      isEdit ? `/api/field-sessions/${initialData!.id}` : "/api/field-sessions",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setLoading(false);

    if (!res.ok) { toast.error("Begehung konnte nicht gespeichert werden."); return; }
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
    if (!res.ok) { toast.error("Begehung konnte nicht gelöscht werden."); return; }
    toast.success("Begehung gelöscht.");
    router.push("/dashboard/sessions");
    router.refresh();
  };

  return (
    <>
      <h1 className="text-4xl font-bold truncate mb-3">
        {watchName || (isEdit ? "Begehung bearbeiten" : "Neue Begehung")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card className="bg-white dark:bg-gray-900 border border-border">
          <div className="py-6 px-6 space-y-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="z. B. Äcker bei Mühlhausen"
                {...register("name", { required: true })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Notizen zur Begehung, Bodenbeschaffenheit, Wetterbedingungen …"
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="namingScheme">
                Benennungsschema für Funde{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="namingScheme"
                placeholder="z. B. {session}-{n:03} oder Fund {n} – {datum}"
                {...register("namingScheme")}
              />
              <p className="text-xs text-muted-foreground">
                Tokens: <code className="bg-muted px-1 rounded">{"{session}"}</code> Session-Name,{" "}
                <code className="bg-muted px-1 rounded">{"{n}"}</code> Fundnummer,{" "}
                <code className="bg-muted px-1 rounded">{"{n:03}"}</code> mit Nullen (001),{" "}
                <code className="bg-muted px-1 rounded">{"{date}"}</code> Datum (YYYY-MM-DD)
              </p>
              {namingPreview && (
                <p className="text-xs text-foreground">
                  Vorschau: <span className="font-medium">{namingPreview}</span>,{" "}
                  <span className="text-muted-foreground">
                    {applyNamingScheme(watchNamingScheme!, watchName || "Session", 2)}, …
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-row flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <Label>Datum (von)</Label>
                <DatePicker control={control} name="dateFrom" rules={{ required: true }} placeholder="TT.MM.JJJJ" />
                {errors.dateFrom && <p className="text-xs text-destructive">{errors.dateFrom.message as string}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Datum (bis, optional)</Label>
                <DatePicker control={control} name="dateTo" placeholder="TT.MM.JJJJ" />
                {errors.dateTo && <p className="text-xs text-destructive">{errors.dateTo.message as string}</p>}
              </div>
            </div>

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
                    <option key={d.id} value={d.id}>{d.company} {d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        <ZonePicker
          zones={zone.zones}
          selectedZoneId={zone.selectedZoneId}
          isDrawingNewZone={zone.isDrawingNewZone}
          newZoneName={zone.newZoneName}
          newZoneCoords={zone.newZoneCoords}
          onSelectChange={zone.handleSelectChange}
          onNewZoneNameChange={zone.setNewZoneName}
          onNewZoneCoordsChange={zone.setNewZoneCoords}
        />

        {allFindings.length > 0 && (
          <FindingsPicker
            allFindings={allFindings}
            filteredFindings={filteredFindings}
            initialSelectedIds={initialData?.findingIds}
            onChange={setSelectedFindingIds}
          />
        )}

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
            ) : isEdit ? "Änderungen speichern" : "Begehung speichern"}
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
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
