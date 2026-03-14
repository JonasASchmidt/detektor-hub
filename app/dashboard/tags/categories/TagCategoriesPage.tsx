"use client";

import { useState } from "react";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import type { TagCategory } from "@prisma/client";
import { TagCategoryForm } from "@/components/tags/TagCategoryForm";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Props {
  initialCategories: TagCategoryWithTags[];
}

export default function TagCategoriesPage({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");

  const handleNewCategory = (category: TagCategory) => {
    setCategories([{ ...category, tags: [] }, ...categories]);
    toast.success("Tag-Kategorie wurde erstellt!");
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

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Tag Kategorien</h1>
      <p className="text-md text-muted-foreground">
        Tag-Kategorien helfen dabei, archäologische Funde systematisch zu
        organisieren. Jede Kategorie enthält spezifische Tags, die eine genauere
        Beschreibung ermöglichen.
      </p>

      {/* Creation form first */}
      <Card className="bg-muted dark:bg-gray-900">
        <TagCategoryForm onAddCategory={handleNewCategory} />
      </Card>

      {/* Search + list below */}
      <Input
        placeholder="Suche..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:max-w-[200px]"
      />

      <Card className="bg-muted dark:bg-gray-900">
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">Bisher wurden keine Kategorien erstellt</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">Keine Kategorien gefunden</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Kategorie</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tags</th>
                  <th className="w-8 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((category, i) => (
                  <tr
                    key={category.id}
                    className={`${i < filtered.length - 1 ? "border-b border-black/[0.05]" : ""} hover:bg-black/[0.02] transition-colors`}
                  >
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{category.name}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {category.tags.length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          category.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ConfirmModal
                        title="Tag-Kategorie löschen?"
                        description="Diese Aktion kann nicht rückgängig gemacht werden. Bist du sicher?"
                        onConfirm={() => handleDeleteCategory(category.id)}
                        trigger={
                          <button
                            type="button"
                            disabled={category.tags?.length > 0}
                            className="text-destructive hover:text-destructive/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
