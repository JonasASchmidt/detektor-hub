"use client";

import { useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import TagComponent from "./Tag";
import { Tag } from "@prisma/client";

interface Props {
  onChange: (tags: Tag[]) => void;
  placeholder: string;
  selected: Tag[];
  tagCategories: TagCategoryWithTags[];
}

export default function TagSelect({
  onChange,
  placeholder,
  selected,
  tagCategories,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleUnselect = (option: string) => {
    onChange(selected.filter((s) => s.id !== option));
  };

  return (
    <Command className="overflow-visible bg-transparent">
      <div className="group border border-input px-1 py-1 text-sm ring-offset-background rounded-md focus-within:ring-1 focus-within:ring-ring ">
        <div className="flex gap-1 flex-wrap items-center">
          {selected.map((option) => {
            return (
              <TagComponent
                key={`tag_${option.id}`}
                onClose={handleUnselect}
                tag={option}
              />
            );
          })}
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="ml-2 py-0 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open ? (
          <div className="absolute w-full z-10 top-0 rounded-md border border-black bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandEmpty>Keine Tags gefunden.</CommandEmpty>
              {tagCategories.map((category) => {
                const filtered = category.tags.filter(
                  (tag) =>
                    tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
                    !selected.find((t) => t.id === tag.id)
                );
                if (filtered.length === 0) return null;

                return (
                  <CommandGroup
                    key={category.id}
                    heading={category.name}
                    className="h-full overflow-auto border-black"
                  >
                    <div className="flex flex-wrap gap-2">
                      {filtered.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onChange([...selected, tag]);
                              setInputValue("");
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onSelect={() => {
                            setInputValue("");
                            onChange([...selected, tag]);
                          }}
                          className="p-0 border-none bg-transparent hover:bg-transparent focus:bg-transparent focus-visible:ring-0"
                        >
                          <TagComponent tag={tag} />
                        </CommandItem>
                      ))}
                    </div>
                  </CommandGroup>
                );
              })}
            </CommandList>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
