"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminUnitCombobox from "./AdminUnitCombobox";

import {
  officialRoleSchema,
  OfficialRoleFormData,
  CAPABILITY_LABELS,
  ADMIN_UNIT_TYPE_LABELS,
} from "@/schemas/official-role";
import { CAPABILITIES } from "@/lib/capabilities";

interface Scope {
  adminUnitType: "FEDERAL_STATE" | "COUNTY" | "MUNICIPALITY";
  adminUnitName: string;
}

interface Props {
  roleId?: string; // present in edit mode
  initialData?: {
    name: string;
    description?: string | null;
    badgeLabel?: string | null;
    badgeColor?: string | null;
    priority: number;
    capabilities: string[];
    scopes: Scope[];
  };
}

export default function RoleForm({ roleId, initialData }: Props) {
  const isEdit = !!roleId;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Scopes managed outside react-hook-form to keep the dynamic array logic simple
  const [scopes, setScopes] = useState<Scope[]>(initialData?.scopes ?? []);
  const [scopeError, setScopeError] = useState<string | null>(null);

  // Pending scope being built in the "add scope" inline form
  const [pendingType, setPendingType] = useState<Scope["adminUnitType"] | "">("");
  const [pendingName, setPendingName] = useState("");
  const [showScopeAdd, setShowScopeAdd] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfficialRoleFormData>({
    resolver: zodResolver(officialRoleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      badgeLabel: initialData?.badgeLabel ?? "",
      badgeColor: initialData?.badgeColor ?? "#2d2d2d",
      priority: initialData?.priority ?? 0,
      capabilities: (initialData?.capabilities ?? []) as OfficialRoleFormData["capabilities"],
      scopes: initialData?.scopes ?? [],
    },
  });

  const watchedCapabilities = watch("capabilities") ?? [];
  const watchedBadgeLabel = watch("badgeLabel");
  const watchedBadgeColor = watch("badgeColor");

  function toggleCapability(cap: (typeof CAPABILITIES)[number]) {
    const current = watchedCapabilities;
    const next = current.includes(cap)
      ? current.filter((c) => c !== cap)
      : [...current, cap];
    setValue("capabilities", next as OfficialRoleFormData["capabilities"], {
      shouldValidate: true,
    });
  }

  function addScope() {
    if (!pendingType || !pendingName.trim()) return;
    const next: Scope[] = [
      ...scopes,
      { adminUnitType: pendingType as Scope["adminUnitType"], adminUnitName: pendingName.trim() },
    ];
    setScopes(next);
    setValue("scopes", next as OfficialRoleFormData["scopes"], { shouldValidate: true });
    setPendingType("");
    setPendingName("");
    setShowScopeAdd(false);
    setScopeError(null);
  }

  function removeScope(index: number) {
    const next = scopes.filter((_, i) => i !== index);
    setScopes(next);
    setValue("scopes", next as OfficialRoleFormData["scopes"], { shouldValidate: true });
  }

  async function onSubmit(data: OfficialRoleFormData) {
    if (scopes.length === 0) {
      setScopeError("Mindestens einen Bereich angeben");
      return;
    }
    setScopeError(null);
    setLoading(true);

    try {
      const url = isEdit ? `/api/official-roles/${roleId}` : "/api/official-roles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, scopes }),
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Fehler beim Speichern");
        return;
      }

      toast.success(isEdit ? "Rolle aktualisiert" : "Rolle erstellt");
      router.push("/management/roles");
      router.refresh();
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base">Allgemein</h2>
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} placeholder="z.B. Genehmigungsbeauftragter Bayern" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={2}
            placeholder="Optionale Beschreibung der Rolle"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="priority">Priorität</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              max={999}
              {...register("priority")}
            />
            <p className="text-xs text-muted-foreground">
              Höchste Priorität bestimmt das angezeigte Badge
            </p>
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Badge */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base">Badge</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="badgeLabel">Label</Label>
            <Input
              id="badgeLabel"
              {...register("badgeLabel")}
              placeholder="z.B. BY-Mod"
              maxLength={20}
            />
            {errors.badgeLabel && (
              <p className="text-sm text-destructive">{errors.badgeLabel.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="badgeColor">Farbe</Label>
            <div className="flex items-center gap-2">
              <input
                id="badgeColor"
                type="color"
                {...register("badgeColor")}
                className="h-9 w-12 cursor-pointer rounded-md border p-1"
              />
              <Input
                value={watchedBadgeColor ?? ""}
                onChange={(e) => setValue("badgeColor", e.target.value)}
                placeholder="#2d2d2d"
                className="w-28 font-mono text-sm"
              />
            </div>
            {errors.badgeColor && (
              <p className="text-sm text-destructive">{errors.badgeColor.message}</p>
            )}
          </div>
          {/* Live preview */}
          {watchedBadgeLabel && (
            <div className="pb-1">
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: watchedBadgeColor ?? "#2d2d2d" }}
              >
                {watchedBadgeLabel}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Capabilities */}
      <section className="space-y-3">
        <h2 className="font-semibold text-base">Berechtigungen *</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CAPABILITIES.map((cap) => (
            <label
              key={cap}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:border-foreground transition-colors"
            >
              <input
                type="checkbox"
                checked={watchedCapabilities.includes(cap)}
                onChange={() => toggleCapability(cap)}
                className="accent-foreground"
              />
              <span className="text-sm">{CAPABILITY_LABELS[cap]}</span>
            </label>
          ))}
        </div>
        {errors.capabilities && (
          <p className="text-sm text-destructive">{errors.capabilities.message}</p>
        )}
      </section>

      {/* Scopes */}
      <section className="space-y-3">
        <h2 className="font-semibold text-base">Zuständigkeitsbereiche *</h2>

        {scopes.length > 0 && (
          <ul className="space-y-1">
            {scopes.map((scope, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  <span className="text-muted-foreground mr-2">
                    {ADMIN_UNIT_TYPE_LABELS[scope.adminUnitType]}
                  </span>
                  {scope.adminUnitName}
                </span>
                <button
                  type="button"
                  onClick={() => removeScope(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Inline add form */}
        {showScopeAdd ? (
          <div className="flex flex-wrap gap-2 items-end rounded-md border p-3">
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select
                value={pendingType}
                onValueChange={(v) => {
                  setPendingType(v as Scope["adminUnitType"]);
                  setPendingName(""); // reset name when type changes
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEDERAL_STATE">Bundesland</SelectItem>
                  <SelectItem value="COUNTY">Landkreis</SelectItem>
                  <SelectItem value="MUNICIPALITY">Gemeinde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 flex-1 min-w-[180px]">
              <Label>Verwaltungseinheit</Label>
              <AdminUnitCombobox
                type={pendingType as Scope["adminUnitType"]}
                value={pendingName}
                onChange={setPendingName}
                disabled={!pendingType}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addScope}
                disabled={!pendingType || !pendingName.trim()}
              >
                Hinzufügen
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowScopeAdd(false);
                  setPendingType("");
                  setPendingName("");
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowScopeAdd(true)}
            className="gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Bereich hinzufügen
          </Button>
        )}

        {scopeError && <p className="text-sm text-destructive">{scopeError}</p>}
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Wird gespeichert…" : isEdit ? "Speichern" : "Rolle erstellen"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/management/roles")}
          disabled={loading}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
