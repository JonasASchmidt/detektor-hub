"use client";

import { useRef, useState } from "react";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";
import type { TagCategory } from "@prisma/client";
import { TagCategoryForm } from "@/components/tags/TagCategoryForm";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { toast } from "sonner";
import { ArrowUpDown, ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
type SortKey = "name" | "tags";
type SortDir = "asc" | "desc";

interface Props {
  initialCategories: TagCategoryWithTags[];
}

export default function TagCategoriesPage({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNewCategory = (category: TagCategory) => {
    setCategories([{ ...category, tags: [] }, ...categories]);
    toast.success("Tag-Kategorie wurde erstellt!");
  };

  const handleDeleteTag = async (categoryId: string, tagId: string) => {
    const res = await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Fehler beim Löschen des Tags.");
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, tags: c.tags.filter((t) => t.id !== tagId) } : c
      )
    );
    toast.success("Tag gelöscht.");
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/tag-categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return toast.error(data.error);
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Tag-Kategorie wurde gelöscht!");
  };

  function startEditing(category: TagCategoryWithTags) {
    setEditingId(category.id);
    setEditingName(category.name);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function saveEdit(id: string) {
    const trimmed = editingName.trim();
    const original = categories.find((c) => c.id === id)?.name;
    setEditingId(null);
    if (!trimmed || trimmed === original) return;

    const res = await fetch(`/api/tag-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) {
      toast.error("Fehler beim Speichern.");
      return;
    }
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name: trimmed } : c));
    toast.success("Kategorie umbenannt.");
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />;
  }

  const filtered = categories
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return mul * a.name.localeCompare(b.name);
      return mul * (a.tags.length - b.tags.length);
    });

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Tag Kategorien</h1>
      <p className="text-md text-muted-foreground">
        Tag-Kategorien helfen dabei, archäologische Funde systematisch zu
        organisieren. Jede Kategorie enthält spezifische Tags, die eine genauere
        Beschreibung ermöglichen.
      </p>

      <Input
        placeholder="Suche..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:max-w-[200px]"
      />

      <Card className="rounded-xl bg-parchment">
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">Bisher wurden keine Kategorien erstellt</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">Keine Kategorien gefunden</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Kategorie <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => toggleSort("tags")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Tags <SortIcon col="tags" />
                    </button>
                  </th>
                  <th className="w-20 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((category, i) => (
                  <tr
                    key={category.id}
                    className={`${i < filtered.length - 1 ? "border-b border-black/[0.05]" : ""} hover:bg-black/[0.02] transition-colors`}
                  >
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                      <div className="flex items-center h-5">
                        {editingId === category.id ? (
                          <input
                            ref={inputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => saveEdit(category.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(category.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="bg-transparent border-b border-foreground outline-none w-full font-bold p-0 h-5 leading-5 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="font-bold text-sm">{category.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {category.tags.length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          category.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded uppercase text-[11px] font-semibold tracking-wide text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                              <ConfirmModal
                                title="Tag löschen?"
                                description={`"${tag.name}" wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`}
                                onConfirm={() => handleDeleteTag(category.id, tag.id)}
                                trigger={
                                  <button
                                    type="button"
                                    className="opacity-70 hover:opacity-100 transition-opacity"
                                    title="Tag löschen"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                }
                              />
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(category)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Umbenennen"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <ConfirmModal
                          title="Tag-Kategorie löschen?"
                          description={category.tags.length > 0 ? `Kategorie und alle ${category.tags.length} enthaltenen Tags werden dauerhaft gelöscht. Bist du sicher?` : "Diese Aktion kann nicht rückgängig gemacht werden. Bist du sicher?"}
                          onConfirm={() => handleDeleteCategory(category.id)}
                          trigger={
                            <button
                              type="button"
                              className="text-destructive hover:text-destructive/70 transition-colors p-1"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-xl bg-parchment">
        <TagCategoryForm onAddCategory={handleNewCategory} />
      </Card>
    </div>
  );
}
