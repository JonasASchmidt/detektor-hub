"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import type { Tag, TagCategory } from "@prisma/client";
import { TagForm } from "./TagForm";
import { Input } from "@/components/ui/input";
import TagComponent from "@/components/tags/Tag";
import { TagDeleteModal } from "@/components/modals/TagDeleteModal";

interface Props {
  initialTags: Tag[];
  tagCategories: TagCategory[];
}

export default function Dashboard({ initialTags, tagCategories }: Props) {
  const [selectedTag, setSelectedTag] = useState<Tag>();
  const [tags, setTags] = useState(initialTags);
  const [search, setSearch] = useState("");
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

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

  const handleDeleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setTagToDelete(null);
  };

  return (
    <div className="px-4 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
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
      <Card className="rounded-xl bg-parchment">
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
                    onClose={() => setTagToDelete(tag)}
                    tag={tag}
                    className="!h-8 text-sm px-3"
                  />
                ))}
            <TagDeleteModal
              tag={tagToDelete}
              allTags={tags}
              onClose={() => setTagToDelete(null)}
              onDeleted={handleDeleteTag}
            />
        </CardContent>
      </Card>
      <Card className="rounded-xl bg-parchment">
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
