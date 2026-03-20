"use client";

import { useState, useEffect, useRef } from "react";
import { FolderPlus, Search, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CollectionSummary = {
  id: string;
  name: string;
  _count: { findings: number };
};

interface Props {
  findingId: string;
}

export default function AddToCollectionButton({ findingId }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load the user's collections and check which ones already contain this finding
  useEffect(() => {
    if (!open || !session?.user?.id) return;
    setLoading(true);
    fetch(`/api/collections?userId=${session.user.id}`)
      .then((r) => r.json())
      .then(async (data) => {
        const cols: CollectionSummary[] = data.collections ?? [];
        setCollections(cols);
        // Check membership for each collection
        const memberIds = new Set<string>();
        await Promise.all(
          cols.map(async (c) => {
            const res = await fetch(`/api/collections/${c.id}`);
            const d = await res.json();
            const isMember = d.collection?.findings?.some((f: { id: string }) => f.id === findingId);
            if (isMember) memberIds.add(c.id);
          })
        );
        setMemberOf(memberIds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, session?.user?.id, findingId]);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else { setSearch(""); setCreating(false); setNewName(""); }
  }, [open]);

  // Close on outside click
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
    const isMember = memberOf.has(collectionId);
    try {
      const res = await fetch(`/api/collections/${collectionId}/findings`, {
        method: isMember ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId }),
      });
      if (!res.ok) throw new Error();
      setMemberOf((prev) => {
        const next = new Set(prev);
        isMember ? next.delete(collectionId) : next.add(collectionId);
        return next;
      });
      toast.success(isMember ? "Aus Sammlung entfernt." : "Zur Sammlung hinzugefügt.");
    } catch {
      toast.error("Fehler beim Aktualisieren.");
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
      const created: CollectionSummary = { ...data.collection, _count: { findings: 0 } };
      setCollections((prev) => [created, ...prev]);
      // Immediately add the finding to the new collection
      await handleToggle(created.id);
      setCreating(false);
      setNewName("");
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
              <p className="text-xs text-muted-foreground px-2 py-1">Lädt…</p>
            )}
            {!loading && filtered.length === 0 && !creating && (
              <p className="text-xs text-muted-foreground px-2 py-1">Keine Sammlungen gefunden.</p>
            )}
            {filtered.map((c) => {
              const isMember = memberOf.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggle(c.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left text-sm transition-colors"
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      isMember
                        ? "bg-[#2d2d2d] border-[#2d2d2d]"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isMember && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="truncate flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {c._count.findings}
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
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                className="h-8 text-sm flex-1"
                maxLength={100}
              />
              <Button size="sm" className="h-8 px-2 font-bold" onClick={handleCreate} disabled={!newName.trim()}>
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
