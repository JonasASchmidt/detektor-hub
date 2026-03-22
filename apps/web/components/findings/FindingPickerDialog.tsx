"use client";

/**
 * FindingPickerDialog
 *
 * Reusable dialog for selecting findings to add to a collection (or any other
 * purpose that needs a searchable, filterable finding list with checkboxes).
 *
 * Props:
 *   trigger        — the button/element that opens the dialog
 *   collectionId   — collection to add/remove findings from
 *   existingIds    — finding IDs already in the collection; used for initial checkbox state
 *   onUpdate       — called after each add/remove with the updated ID set
 *
 * Sources:
 *   "Meine Funde"  → GET /api/findings   (own findings, any status)
 *   "Community"    → GET /api/community/findings  (all COMPLETED findings)
 *
 * Filters: text search (q), tags (TagSelectFilter)
 * Pagination: "Mehr laden" button
 */

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, Search, Plus } from "lucide-react";
import { CldImage } from "next-cloudinary";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagSelectFilter, TagOption } from "@/components/filters/TagSelectFilter";

// Compact finding representation used inside the picker
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
  onUpdate?: (updatedIds: string[]) => void;
}

export function FindingPickerDialog({ trigger, collectionId, existingIds, onUpdate }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Filter state
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

  // Membership state — starts from existingIds, updated live as user toggles
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(existingIds));
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Sync memberIds when dialog reopens with fresh existingIds
  useEffect(() => {
    if (open) setMemberIds(new Set(existingIds));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tags once
  useEffect(() => {
    if (!open) return;
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setAvailableTags(data.tags ?? []))
      .catch(() => {});
  }, [open]);

  // Build API URL for findings
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

  // Fetch first page whenever filters change
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

  // Load next page
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

  const handleToggle = async (findingId: string) => {
    if (pendingIds.has(findingId)) return;
    const isMember = memberIds.has(findingId);

    // Optimistic
    setPendingIds((p) => new Set(p).add(findingId));
    setMemberIds((prev) => {
      const next = new Set(prev);
      isMember ? next.delete(findingId) : next.add(findingId);
      return next;
    });

    try {
      const res = await fetch(`/api/collections/${collectionId}/findings`, {
        method: isMember ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId }),
      });
      if (!res.ok) throw new Error();

      const next = new Set(memberIds);
      isMember ? next.delete(findingId) : next.add(findingId);
      onUpdate?.(Array.from(next));
    } catch {
      // Revert
      setMemberIds((prev) => {
        const next = new Set(prev);
        isMember ? next.add(findingId) : next.delete(findingId);
        return next;
      });
      toast.error("Fehler beim Aktualisieren.");
    } finally {
      setPendingIds((p) => {
        const next = new Set(p);
        next.delete(findingId);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[640px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle>Funde hinzufügen</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="px-5 py-3 border-b space-y-3">
          {/* Source toggle */}
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

          {/* Search + tag filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Name oder Beschreibung…"
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

        {/* Findings list */}
        <div className="overflow-y-auto max-h-[420px] divide-y divide-black/[0.04]">
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

          {findings.map((f) => {
            const isMember = memberIds.has(f.id);
            const isPending = pendingIds.has(f.id);
            const thumb = f.images?.[0]?.publicId;

            return (
              <button
                key={f.id}
                onClick={() => handleToggle(f.id)}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-60"
              >
                {/* Checkbox */}
                <span
                  className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    isMember
                      ? "bg-[#2d2d2d] border-[#2d2d2d]"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                  ) : (
                    isMember && <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
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
                    {f.user?.name && (
                      <span className="text-xs text-muted-foreground">{f.user.name}</span>
                    )}
                    {f.tags?.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="inline-block px-1.5 py-0 rounded text-[10px] font-semibold uppercase tracking-wide text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add hint when not yet a member */}
                {!isMember && !isPending && (
                  <Plus className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
              </button>
            );
          })}

          {/* Load more */}
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
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Lädt…
                  </>
                ) : (
                  "Mehr laden"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
