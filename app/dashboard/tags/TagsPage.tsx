"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Tag, TagCategory } from "@prisma/client";
import { TagForm } from "@/app/dashboard/tags/TagForm";
import { Input } from "@/components/ui/input";
import TagComponent from "@/components/tags/Tag";

interface Props {
  initialTags: Tag[];
  tagCategories: TagCategory[];
}

export default function Dashboard({ initialTags, tagCategories }: Props) {
  const [selectedTag, setSelectedTag] = useState<Tag>();
  const [tags, setTags] = useState(initialTags);
  const [search, setSearch] = useState("");

  const handleClickTag = (tag: Tag) => setSelectedTag(tag);

  const handleNewTag = (tag: Tag) => {
    setTags([tag, ...tags]);
  };

  const handleUpdateTag = (updatedTag: Tag) => {
    setTags(
      tags.map((tag) => {
        if (tag.id === updatedTag.id) {
          return updatedTag;
        }
        return tag;
      })
    );
    resetTag();
  };

  const resetTag = () => {
    setSelectedTag(undefined);
  };

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Tags</h1>
      <p className="text-md text-muted-foreground">
        Verwalte hier deine Tags, um Funde zu kategorisieren und schneller zu finden. Klicke einen Tag an, um ihn zu bearbeiten.
      </p>
      <Input
        placeholder="Suche..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:max-w-[200px]"
      />
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6 flex flex-wrap gap-2">
          {tags.length === 0
            ? "Bisher wurden keine Tags erstellt"
            : tags
                .filter((tag) =>
                  !search || tag.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((tag) => (
                  <TagComponent
                    key={tag.id}
                    onClick={() => handleClickTag(tag)}
                    tag={tag}
                  />
                ))}
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <TagForm
          onAddTag={handleNewTag}
          onUpdateTag={handleUpdateTag}
          initialTag={selectedTag}
          resetTag={resetTag}
          tagCategories={tagCategories}
        />
      </Card>
    </div>
  );
}
