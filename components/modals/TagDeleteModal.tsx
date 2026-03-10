"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tag } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  tag: Tag | null;
  allTags: Tag[];
  onClose: () => void;
  onDeleted: (tagId: string) => void;
}

export function TagDeleteModal({ tag, allTags, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [findingsCount, setFindingsCount] = useState<number>(0);
  const [checking, setChecking] = useState(false);
  const [replacementTagId, setReplacementTagId] = useState<string>("");

  useEffect(() => {
    if (tag) {
      setChecking(true);
      fetch(`/api/tags/${tag.id}`)
        .then((res) => res.json())
        .then((data) => setFindingsCount(data.findingsCount || 0))
        .finally(() => setChecking(false));
    }
  }, [tag]);

  const handleDelete = async () => {
    if (!tag) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: "DELETE",
        body: JSON.stringify({ replacementTagId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Löschen");
      }

      toast.success("Tag wurde erfolgreich gelöscht");
      onDeleted(tag.id);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tag) return null;

  const otherTags = allTags.filter((t) => t.id !== tag.id);

  return (
    <Dialog open={!!tag} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tag löschen: {tag.name}</DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du diesen Tag löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {findingsCount > 0 ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Dieser Tag ist aktuell <strong>{findingsCount}</strong> Funden zugeordnet.
                </p>
                <div className="mt-3 space-y-2">
                  <label className="text-xs font-medium text-amber-900 dark:text-amber-100 italic">
                    Optional: Wähle einen Ersatz-Tag für diese Funde:
                  </label>
                  <Select value={replacementTagId} onValueChange={setReplacementTagId}>
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue placeholder="Ersatz-Tag auswählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Ersatz (Zuordnung entfernen)</SelectItem>
                      {otherTags.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Dieser Tag wird aktuell in keinem Fund verwendet.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading || checking}
          >
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
            Unwiderruflich löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
