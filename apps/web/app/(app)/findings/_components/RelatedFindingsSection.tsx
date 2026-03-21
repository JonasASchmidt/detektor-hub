"use client";

import { useState, useEffect, useRef } from "react";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link2, X, Plus, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RelatedFindingSummary } from "@/types/RelatedFindingSummary";

interface Props {
  findingId: string;
  initialRelated: RelatedFindingSummary[];
  isOwner: boolean;
}

export default function RelatedFindingsSection({
  findingId,
  initialRelated,
  isOwner,
}: Props) {
  const [related, setRelated] = useState<RelatedFindingSummary[]>(initialRelated);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RelatedFindingSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus the search input when picker opens
  useEffect(() => {
    if (pickerOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
      setResults([]);
    }
  }, [pickerOpen]);

  // Debounced search: query the findings list API
  useEffect(() => {
    if (!pickerOpen) return;
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/findings?search=${encodeURIComponent(search)}&limit=8&status=COMPLETED`
        );
        if (!res.ok) return;
        const data = await res.json();

        // Exclude self and already-linked findings
        const linkedIds = new Set([findingId, ...related.map((r) => r.id)]);
        const filtered = (data.findings ?? []).filter(
          (f: { id: string }) => !linkedIds.has(f.id)
        );

        // Shape API results into RelatedFindingSummary
        setResults(
          filtered.map((f: {
            id: string;
            name: string | null;
            foundAt: string;
            createdAt: string;
            images: { publicId: string }[];
            user: { id: string; name: string | null; image: string | null };
          }) => ({
            id: f.id,
            name: f.name,
            foundAt: new Date(f.foundAt),
            createdAt: new Date(f.createdAt),
            images: f.images ?? [],
            user: f.user,
          }))
        );
      } catch {
        // silently ignore search errors
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pickerOpen, findingId, related]);

  const handleLink = async (target: RelatedFindingSummary) => {
    try {
      const res = await fetch(`/api/findings/${findingId}/related`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedId: target.id }),
      });
      if (!res.ok) throw new Error();
      setRelated((prev) => [...prev, target]);
      setPickerOpen(false);
      toast.success("Fund verknüpft.");
    } catch {
      toast.error("Fehler beim Verknüpfen.");
    }
  };

  const handleUnlink = async (relatedId: string) => {
    try {
      const res = await fetch(`/api/findings/${findingId}/related`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedId }),
      });
      if (!res.ok) throw new Error();
      setRelated((prev) => prev.filter((r) => r.id !== relatedId));
      toast.success("Verknüpfung entfernt.");
    } catch {
      toast.error("Fehler beim Entfernen.");
    }
  };

  // Don't render the section at all if there's nothing to show
  if (related.length === 0 && !isOwner) return null;

  return (
    <div className="space-y-3 pt-2">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Link2 className="h-5 w-5" strokeWidth={1.5} />
        Verwandte Funde {related.length > 0 && `(${related.length})`}
      </h2>

      {/* Linked findings list */}
      {related.length > 0 && (
        <div className="space-y-2">
          {related.map((item) => (
            <RelatedFindingCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onUnlink={() => handleUnlink(item.id)}
            />
          ))}
        </div>
      )}

      {/* Add link button / picker (owner only) */}
      {isOwner && (
        <div>
          {!pickerOpen ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Fund verknüpfen
            </Button>
          ) : (
            <div className="border-2 border-black/[0.08] rounded-lg p-3 space-y-2 bg-muted">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchRef}
                  placeholder="Fund suchen…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {searching && (
                <p className="text-sm text-muted-foreground px-1">Suche…</p>
              )}

              {!searching && search.trim() && results.length === 0 && (
                <p className="text-sm text-muted-foreground px-1">
                  Keine Funde gefunden.
                </p>
              )}

              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleLink(r)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-background text-left transition-colors"
                    >
                      <FindingThumbnail images={r.images} name={r.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.name ?? "Unbenannter Fund"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.foundAt ?? r.createdAt), "d. MMM yyyy", { locale: de })}
                          {r.user?.name && ` · ${r.user.name}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs h-7 px-2"
                onClick={() => setPickerOpen(false)}
              >
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelatedFindingCard({
  item,
  isOwner,
  onUnlink,
}: {
  item: RelatedFindingSummary;
  isOwner: boolean;
  onUnlink: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border-2 border-black/[0.05] rounded-lg bg-muted group">
      <Link href={`/findings/${item.id}`} className="shrink-0">
        <FindingThumbnail images={item.images} name={item.name} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/findings/${item.id}`}
          className="text-sm font-semibold hover:underline block truncate"
        >
          {item.name ?? "Unbenannter Fund"}
        </Link>
        <p className="text-xs text-muted-foreground">
          {format(new Date(item.foundAt ?? item.createdAt), "d. MMMM yyyy", { locale: de })}
          {item.user?.name && (
            <span>
              {" · "}
              <Link
                href={`/profile/${item.user.id}`}
                className="hover:underline"
              >
                {item.user.name}
              </Link>
            </span>
          )}
        </p>
      </div>
      {isOwner && (
        <button
          onClick={onUnlink}
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Verknüpfung entfernen"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function FindingThumbnail({
  images,
  name,
  size,
}: {
  images: { publicId: string }[];
  name: string | null;
  size: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const px = size === "sm" ? 40 : 48;

  if (images.length > 0) {
    return (
      <div className={`${dim} rounded-md overflow-hidden bg-muted shrink-0`}>
        <CldImage
          src={images[0].publicId}
          width={px}
          height={px}
          crop="fill"
          gravity="auto"
          alt={name ?? "Fund"}
          format="auto"
          quality="auto"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-md bg-zinc-200 flex items-center justify-center shrink-0`}
    >
      <Link2 className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
    </div>
  );
}
