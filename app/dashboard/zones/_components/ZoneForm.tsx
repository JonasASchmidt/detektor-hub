"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { zoneSchema, ZoneFormData } from "@/schemas/zone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toGeoJSON, fromGeoJSON } from "@/lib/geo";

const ZonePickerMap = dynamic(() => import("@/components/map/zone-picker-map"), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-muted animate-pulse rounded-lg" />,
});

interface Props {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    geometryGeoJson?: string | null;
  };
}

export default function ZoneForm({ initialData }: Props) {
  const isEdit = !!initialData;
  const router = useRouter();

  const [zoneCoords, setZoneCoords] = useState<[number, number][] | null>(() =>
    initialData?.geometryGeoJson ? fromGeoJSON(initialData.geometryGeoJson) : null
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
    },
  });

  const watchName = watch("name");

  const onSubmit: SubmitHandler<ZoneFormData> = async (data) => {
    setLoading(true);
    const geometry =
      zoneCoords && zoneCoords.length >= 3 ? toGeoJSON(zoneCoords) : null;

    const payload = { ...data, geometry };

    const res = await fetch(
      isEdit ? `/api/zones/${initialData!.id}` : "/api/zones",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setLoading(false);

    if (!res.ok) {
      toast.error("Zone konnte nicht gespeichert werden.");
      return;
    }
    toast.success(isEdit ? "Zone aktualisiert!" : "Neue Zone angelegt!");
    router.push("/dashboard/zones");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (
      !confirm(
        "Zone wirklich löschen? Zugehörige Begehungen werden nicht gelöscht, verlieren aber die Zonenzuordnung."
      )
    )
      return;
    setDeleting(true);
    const res = await fetch(`/api/zones/${initialData.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Zone konnte nicht gelöscht werden.");
      return;
    }
    toast.success("Zone gelöscht.");
    router.push("/dashboard/zones");
    router.refresh();
  };

  return (
    <>
      <h1 className="text-4xl font-bold truncate mb-3">
        {watchName || (isEdit ? "Zone bearbeiten" : "Neue Zone")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card className="bg-white dark:bg-gray-900 border border-border">
          <div className="py-6 px-6 space-y-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="z. B. Feld Müller, Nordhang"
                {...register("name", { required: true })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                placeholder="Beschreibung des Gebiets, Zugangsinformationen …"
                rows={3}
                {...register("description")}
              />
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-border">
          <div className="py-4 px-6 space-y-3">
            <div>
              <p className="text-xl font-bold">Zonenumriss</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Klicke auf die Karte um das Gebiet als Polygon einzuzeichnen.
              </p>
            </div>
            <ZonePickerMap value={zoneCoords ?? undefined} onChange={setZoneCoords} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            variant="ghost"
            size="lg"
            className="flex-1 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold px-3 transition-all duration-150 ease-in-out"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bitte warten
              </>
            ) : isEdit ? (
              "Änderungen speichern"
            ) : (
              "Zone speichern"
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
