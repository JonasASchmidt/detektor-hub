"use client";

/**
 * CollectionFindingAdder
 *
 * Dialog for adding/removing findings from a collection.
 * All checkbox changes are local state — no API calls until "Auswahl übernehmen".
 * On confirm: batch POST/DELETE for every changed item, then call onApply() once.
 */

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Check, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CldImage } from "next-cloudinary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagSelectFilter, TagOption } from "@/components/filters/TagSelectFilter";

type PickerFinding = {
  id: string;
  name: string;
  foundAt: Date | string | null;
  status: string;
  images: { publicId: string }[];
  tags: { id: string; name: string; color: string }[];
  user: { id: string; name: string | null } | null;
};

type Source = "mine" | "community";
const PAGE_SIZE = 20;

interface Props {
  trigger: React.ReactNode;
  collectionId: string;
  existingIds: string[];
  onApply: () => Promise<void>;
}

export default function CollectionFindingDialog({
  trigger,
  collectionId,
  existingIds,
  onApply,
}: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Filters
  const [source, setSource] = useState<Source>("mine");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  // Results
  const [findings, setFindings] = useState<PickerFinding[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Local selection state — changes don't hit the API until "Auswahl übernehmen"
  // initialIds: snapshot of what was in the collection when the dialog opened
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Re-initialise selection when dialog opens
  useEffect(() => {
    if (open) {
      const snap = new Set(existingIds);
      setInitialIds(snap);
      setSelectedIds(new Set(snap));
    } else {
      // Reset filters on close
      setSearch("");
      setSelectedTags([]);
      setSource("mine");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tags once when dialog first opens (tags don't change often)
  useEffect(() => {
    if (!open || availableTags.length > 0) return;
    fetch("/api/tags")
      .then((r) => r.json())
      // Tags API returns a plain array (not { tags: [] })
      .then((data) => setAvailableTags(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) params.set("q", search.trim());
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      return source === "mine"
        ? `/api/findings?${params}`
        : `/api/community/findings?${params}`;
    },
    [source, search, selectedTags]
  );

  // Re-fetch first page on filter change
  useEffect(() => {
    if (!open || !session?.user?.id) return;
    setPage(1);
    setFindings([]);
    setLoadingFindings(true);
    fetch(buildUrl(1))
      .then((r) => r.json())
      .then((data) => {
        const items: PickerFinding[] = data.findings ?? [];
        setFindings(items);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoadingFindings(false));
  }, [open, source, search, selectedTags, session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetch(buildUrl(nextPage)).then((r) => r.json());
      const items: PickerFinding[] = data.findings ?? [];
      setFindings((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFinding = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Diff: what changed compared to the snapshot when dialog opened
  const toAdd = [...selectedIds].filter((id) => !initialIds.has(id));
  const toRemove = [...initialIds].filter((id) => !selectedIds.has(id));
  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const handleApply = async () => {
    if (!hasChanges) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        ...toAdd.map((findingId) =>
          fetch(`/api/collections/${collectionId}/findings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ findingId }),
          })
        ),
        ...toRemove.map((findingId) =>
          fetch(`/api/collections/${collectionId}/findings`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ findingId }),
          })
        ),
      ]);

      toast.success(
        toAdd.length > 0 && toRemove.length > 0
          ? `${toAdd.length} hinzugefügt, ${toRemove.length} entfernt.`
          : toAdd.length > 0
          ? `${toAdd.length} ${toAdd.length === 1 ? "Fund" : "Funde"} hinzugefügt.`
          : `${toRemove.length} ${toRemove.length === 1 ? "Fund" : "Funde"} entfernt.`
      );

      setOpen(false);
      await onApply();
    } catch {
      toast.error("Fehler beim Aktualisieren der Sammlung.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle>Funde zur Sammlung hinzufügen</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="px-5 py-3 border-b shrink-0 space-y-2.5">
          <div className="flex rounded-lg overflow-hidden border-2 border-black/[0.08] w-fit text-sm font-medium">
            {(["mine", "community"] as Source[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1.5 transition-colors ${
                  source === s
                    ? "bg-[#2d2d2d] text-white"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "mine" ? "Meine Funde" : "Community"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Name suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <TagSelectFilter
              selectedIds={selectedTags}
              options={availableTags}
              onChange={setSelectedTags}
            />
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 divide-y divide-black/[0.04]">
          {loadingFindings && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Lädt…</span>
            </div>
          )}
          {!loadingFindings && findings.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Keine Funde gefunden.
            </div>
          )}

          {findings
            // Hide findings that were already in the collection when the dialog opened.
            // Findings added during this session (not in initialIds) stay visible
            // so the user can easily undo an accidental add.
            .filter((f) => !initialIds.has(f.id))
            .map((f) => {
            const isSelected = selectedIds.has(f.id);
            const wasInCollection = initialIds.has(f.id);
            const thumb = f.images?.[0]?.publicId;

            return (
              <button
                key={f.id}
                onClick={() => toggleFinding(f.id)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Checkbox */}
                <span
                  className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "bg-[#2d2d2d] border-[#2d2d2d]" : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>

                {/* Thumbnail */}
                {thumb ? (
                  <CldImage
                    src={thumb}
                    width={40}
                    height={40}
                    crop="fill"
                    gravity="auto"
                    format="auto"
                    quality="auto"
                    alt=""
                    className="h-10 w-10 rounded-md object-cover shrink-0 border border-black/[0.06]"
                  />
                ) : (
                  <span className="h-10 w-10 rounded-md bg-muted shrink-0 border border-black/[0.06]" />
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {f.foundAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(f.foundAt), "d.M.yy", { locale: de })}
                      </span>
                    )}
                    {source === "community" && f.user?.name && (
                      <span className="text-xs text-muted-foreground">{f.user.name}</span>
                    )}
                    {f.tags?.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="inline-block px-1.5 rounded text-[10px] font-semibold uppercase tracking-wide text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status badge for newly added/removed */}
                {!wasInCollection && isSelected && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-0.5">
                    <Plus className="h-3 w-3" />
                    Neu
                  </span>
                )}
                {wasInCollection && !isSelected && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                    Entfernt
                  </span>
                )}
              </button>
            );
          })}

          {hasMore && !loadingFindings && (
            <div className="px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Lädt…</>
                ) : (
                  "Mehr laden"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer with change summary + confirm */}
        <DialogFooter className="px-5 py-4 border-t shrink-0 flex-row items-center gap-3">
          <span className="flex-1 text-sm text-muted-foreground">
            {hasChanges ? (
              <>
                {toAdd.length > 0 && (
                  <span className="text-green-600 font-medium">{toAdd.length} hinzugefügt</span>
                )}
                {toAdd.length > 0 && toRemove.length > 0 && " · "}
                {toRemove.length > 0 && (
                  <span className="text-red-500 font-medium">{toRemove.length} entfernt</span>
                )}
              </>
            ) : (
              "Keine Änderungen"
            )}
          </span>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button
            onClick={handleApply}
            disabled={saving}
            className="font-bold"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Speichert…</>
            ) : (
              "Auswahl übernehmen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
