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
import {
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";

interface Props<TFieldValues extends FieldValues>
  extends UseControllerProps<TFieldValues> {
  tagCategories: TagCategoryWithTags[];
  placeholder: string;
}

export default function TagSelect<TFieldValues extends FieldValues>({
  tagCategories,
  placeholder,
  ...controllerProps
}: Props<TFieldValues>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { field } = useController(controllerProps);

  const allTags = tagCategories.flatMap((cat) => cat.tags);
  const selectedTags = allTags.filter((tag) => field.value?.includes(tag.id));

  const handleUnselect = (id: string) => {
    field.onChange(field.value.filter((tagId: string) => tagId !== id));
  };

  const handleSelect = (tag: Tag) => {
    if (!field.value.includes(tag.id)) {
      field.onChange([...field.value, tag.id]);
    }
    setInputValue("");
  };

  return (
    <Command className="overflow-visible bg-transparent">
      <div className="group border border-input px-1 py-1 text-sm ring-offset-background rounded-md focus-within:ring-1 focus-within:ring-ring ">
        <div className="flex gap-1 flex-wrap items-center">
          {selectedTags.map((tag) => {
            return (
              <TagComponent
                key={`tag_${tag.id}`}
                onClose={() => handleUnselect(tag.id)}
                tag={tag}
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
                    !field.value?.includes(tag.id)
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
                              handleSelect(tag);
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onSelect={() => handleSelect(tag)}
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
