"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { TagCategory } from "@prisma/client";
import { TagCategoryForm } from "@/components/tags/TagCategoryForm";
import { Trash2 } from "lucide-react";

interface Props {
  initialCategories: TagCategory[];
}

export default function TagCategoriesPage({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [error, setError] = useState("");

  const handleNewCategory = (category: TagCategory) => {
    console.log({ categories, category });
    setCategories([category, ...categories]);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Möchtest du diese Kategorie wirklich löschen?"))
      return;

    try {
      const res = await fetch(`/api/tag-categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Fehler beim Löschen.");
      }

      // Remove the deleted category from the UI
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (error) {
      console.error("Fehler beim Löschen der Kategorie:", error);
      setError("Fehler beim Löschen der Kategorie.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Tag Kategorien
        </h1>
      </header>
      <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
        Tag-Kategorien helfen dabei, archäologische Funde systematisch zu
        organisieren. Jede Kategorie enthält spezifische Tags, die eine genauere
        Beschreibung ermöglichen.
      </p>
      <Card className="bg-white dark:bg-gray-900">
        <TagCategoryForm onAddCategory={handleNewCategory} />
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-6">
          {categories.length === 0 ? (
            "Bisher wurden keine Kategorien erstellt"
          ) : (
            <ul className="space-y-3">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-gray-800 dark:text-gray-200 flex justify-between items-center"
                >
                  <span className="text-gray-800 dark:text-gray-200">
                    {category.name}
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded-md text-sm"
                  >
                    <Trash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
