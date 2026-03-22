"use client";

import { ChangeEvent, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../dialog";
import { Button } from "../../button";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";
import TagComponent from "@/components/tags/Tag";
import { Tag } from "@prisma/client";
import { Input } from "../../input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value?: string[]) => void;
  tagCategories: TagCategoryWithTags[];
  value?: string[];
}

export default function TagModal({
  isOpen,
  onClose,
  onSubmit,
  tagCategories,
  value,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>(value ?? []);

  const handleUnselect = (id: string) => {
    setTags(tags.filter((tagId: string) => tagId !== id));
  };

  const handleSelect = (tag: Tag) => {
    if (!tags.includes(tag.id)) {
      setTags([...tags, tag.id]);
    }
    setInputValue("");
  };

  const handleSubmit = () => {
    onSubmit(tags);
  };

  const selectedTags = tagCategories
    .flatMap((category) => category.tags)
    .filter((tag) => tags?.includes(tag.id));

  const bodyContent = (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-center font-semibold">Gewählte Tags</div>
        <div className="flex gap-1 flex-wrap items-center">
          {selectedTags.map((tag) => {
            return (
              <TagComponent
                key={`tag_${tag.id}`}
                onClose={handleUnselect}
                tag={tag}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-center font-semibold">Tags hinzufügen</div>
        <Input
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          placeholder="Search for Tag"
        />
        {tagCategories.map((category) => {
          const filtered = category.tags.filter(
            (tag) =>
              tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
              !tags?.includes(tag.id)
          );

          if (filtered.length === 0) return null;

          return (
            <div key={category.id}>
              <div className="font-semibold text-sm">{category.name}</div>
              <div className="flex flex-wrap gap-2">
                {filtered.map((tag) => (
                  <div
                    key={tag.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSelect(tag);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleSelect(tag)}
                  >
                    <TagComponent tag={tag} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tags wählen</DialogTitle>
          <DialogDescription>
            Klicke die tags an, um sie dem Fund hinzuzufügen.
          </DialogDescription>
        </DialogHeader>
        {bodyContent}
        <DialogFooter>
          <Button className="w-full" onClick={handleSubmit}>
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
