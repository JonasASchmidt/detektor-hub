"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Tag, TagCategory } from "@prisma/client";
import { TagForm } from "@/components/tags/TagForm";
import TagComponent from "@/components/tags/Tag";

interface Props {
  initialTags: Tag[];
  tagCategories: TagCategory[];
}

export default function Dashboard({ initialTags, tagCategories }: Props) {
  const [tags, setTags] = useState(initialTags);

  const handleNewTag = (tag: Tag) => {
    setTags([tag, ...tags]);
    console.log([tag, ...tags]);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Tags
        </h1>
      </header>
      <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
        Tags sind Schlüsselwörter, die verwendet werden, um archäologische Funde
        zu kategorisieren und leichter auffindbar zu machen. Sie helfen dabei,
        Funde nach verschiedenen Merkmalen zu filtern. Jeder Fund kann mehrere
        Tags haben, sodass eine flexible und detaillierte Suche möglich ist. Auf
        dieser Seite kannst du neue Tags erstellen oder bestehende verwalten.
      </p>
      <Card className="bg-white dark:bg-gray-900">
        <TagForm onAddTag={handleNewTag} tagCategories={tagCategories} />
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6 flex gap-2">
          {tags.length === 0
            ? "Bisher wurden keine Tags erstellt"
            : tags.map((tag) => <TagComponent key={tag.id} tag={tag} />)}
        </CardContent>
      </Card>
    </div>
  );
}
