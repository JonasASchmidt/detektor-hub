"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  collectionId?: string;
  initialName?: string;
  initialDescription?: string;
}

export default function CollectionForm({ collectionId, initialName = "", initialDescription = "" }: Props) {
  const router = useRouter();
  const isEdit = !!collectionId;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const res = await fetch(
        isEdit ? `/api/collections/${collectionId}` : "/api/collections",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
        }
      );

      if (!res.ok) throw new Error();
      const data = await res.json();

      toast.success(isEdit ? "Sammlung aktualisiert." : "Sammlung erstellt.");
      router.push(`/collections/${isEdit ? collectionId : data.collection.id}`);
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Lüneburger Salzplomben"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Beschreibung <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Was verbindet diese Funde?"
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !name.trim()} className="font-bold">
          {saving ? "Speichert…" : isEdit ? "Speichern" : "Sammlung erstellen"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
