"use client";

import { useState, useEffect, useRef } from "react";
import { FolderPlus, Search, Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CollectionSummary = {
  id: string;
  name: string;
  // Local count so we can update it optimistically without a page refresh
  findingCount: number;
};

interface Props {
  findingId: string;
}

export default function AddToCollectionButton({ findingId }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  // Track which collection IDs are currently pending a toggle request
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load user's collections and check which already contain this finding
  useEffect(() => {
    if (!open || !session?.user?.id) return;
    setLoading(true);

    fetch(`/api/collections?userId=${session.user.id}`)
      .then((r) => r.json())
      .then(async (data) => {
        const cols = (data.collections ?? []) as Array<{
          id: string;
          name: string;
          _count: { findings: number };
          findings: { id: string }[];
        }>;

        // Check membership: fetch each collection's finding IDs
        const memberIds = new Set<string>();
        await Promise.all(
          cols.map(async (c) => {
            const res = await fetch(`/api/collections/${c.id}`);
            const d = await res.json();
            const isMember = (d.collection?.findings ?? []).some(
              (f: { id: string }) => f.id === findingId
            );
            if (isMember) memberIds.add(c.id);
          })
        );

        setMemberOf(memberIds);
        setCollections(
          cols.map((c) => ({ id: c.id, name: c.name, findingCount: c._count.findings }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, session?.user?.id, findingId]);

  // Focus search on open; reset state on close
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
      setCreating(false);
      setNewName("");
    }
  }, [open]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!session) return null;

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (collectionId: string) => {
    if (pending.has(collectionId)) return; // debounce double-clicks
    const isMember = memberOf.has(collectionId);

    // Optimistic update
    setPending((p) => new Set(p).add(collectionId));
    setMemberOf((prev) => {
      const next = new Set(prev);
      isMember ? next.delete(collectionId) : next.add(collectionId);
      return next;
    });
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, findingCount: c.findingCount + (isMember ? -1 : 1) }
          : c
      )
    );

    try {
      const res = await fetch(`/api/collections/${collectionId}/findings`, {
        method: isMember ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId }),
      });
      if (!res.ok) throw new Error();
      toast.success(isMember ? "Aus Sammlung entfernt." : "Zur Sammlung hinzugefügt.");
    } catch {
      // Revert optimistic update on error
      setMemberOf((prev) => {
        const next = new Set(prev);
        isMember ? next.add(collectionId) : next.delete(collectionId);
        return next;
      });
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, findingCount: c.findingCount + (isMember ? 1 : -1) }
            : c
        )
      );
      toast.error("Fehler beim Aktualisieren.");
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(collectionId);
        return next;
      });
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const created: CollectionSummary = {
        id: data.collection.id,
        name: data.collection.name,
        findingCount: 0,
      };
      setCollections((prev) => [created, ...prev]);
      setCreating(false);
      setNewName("");
      // Immediately add the finding to the new collection
      await handleToggle(created.id);
    } catch {
      toast.error("Fehler beim Erstellen.");
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
        onClick={() => setOpen((v) => !v)}
      >
        <FolderPlus className="h-4 w-4" />
        Sammlung
      </Button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-64 bg-background border-2 border-black/[0.08] rounded-xl shadow-lg p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              placeholder="Sammlung suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {loading && (
              <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Lädt…
              </div>
            )}
            {!loading && filtered.length === 0 && !creating && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                Keine Sammlungen gefunden.
              </p>
            )}
            {filtered.map((c) => {
              const isMember = memberOf.has(c.id);
              const isPending = pending.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggle(c.id)}
                  disabled={isPending}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left text-sm transition-colors disabled:opacity-60"
                >
                  {/* Checkbox indicator */}
                  <span
                    className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      isMember
                        ? "bg-[#2d2d2d] border-[#2d2d2d]"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />
                    ) : (
                      isMember && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )
                    )}
                  </span>
                  <span className="truncate flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {c.findingCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create new collection inline */}
          {creating ? (
            <div className="flex gap-1.5 pt-1">
              <Input
                autoFocus
                placeholder="Name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                  }
                }}
                className="h-8 text-sm flex-1"
                maxLength={100}
              />
              <Button
                size="sm"
                className="h-8 px-2 font-bold"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                OK
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left text-sm text-muted-foreground transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Neue Sammlung
            </button>
          )}
        </div>
      )}
    </div>
  );
}
