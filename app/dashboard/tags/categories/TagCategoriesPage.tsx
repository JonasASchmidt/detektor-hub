"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import { TagCategory } from "@prisma/client";
import { TagCategoryForm } from "@/components/tags/TagCategoryForm";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  initialCategories: TagCategoryWithTags[];
}

export default function TagCategoriesPage({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);

  const handleNewCategory = (category: TagCategory) => {
    setCategories([{ ...category, tags: [] }, ...categories]);
    toast.success("Tag-Kategorie wurde erstellt!");
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/tag-categories/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      return toast.error(data.error);
    }

    setCategories((prev) => {
      return prev.filter((category) => category.id !== id);
    });
    toast.success("Tag-Kategorie wurde gelöscht!");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-4xl font-bold">Tag Kategorien</h1>
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
                  <ConfirmModal
                    title="Tag-Kategorie löschen?"
                    description="Diese Aktion kann nicht rückgängig gemacht werden. Bist du sicher?"
                    onConfirm={() => handleDeleteCategory(category.id)}
                    trigger={
                      <Button
                        variant="destructive"
                        disabled={category.tags?.length > 0}
                      >
                        <Trash2 />
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
