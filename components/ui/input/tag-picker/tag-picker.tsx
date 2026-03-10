import { useState } from "react";
import { FieldValues, useController, UseControllerProps } from "react-hook-form";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import { Label } from "../../label";
import { Button } from "../../button";
import { Input } from "../../input";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { Tag as TagIcon, X } from "lucide-react";
import TagComponent from "@/components/tags/Tag";

interface Props {
  disabled?: boolean;
  tagCategories: TagCategoryWithTags[];
}

export default function TagPicker<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  tagCategories,
}: UseControllerProps<TFieldValues> & Props) {
  const { field } = useController({ name, control, rules });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIds: string[] = field.value ?? [];
  const allTags = tagCategories.flatMap((c) => c.tags);
  const selectedTags = allTags.filter((t) => selectedIds.includes(t.id));

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    field.onChange(next);
  };

  const filteredCategories = tagCategories
    .map((cat) => ({
      ...cat,
      tags: cat.tags.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.tags.length > 0);

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Tags</Label>
      <div className="flex flex-row gap-1.5 flex-wrap items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 w-auto gap-1.5 shrink-0 ${selectedIds.length > 0 ? "text-foreground" : "text-muted-foreground"}`}
            >
              <TagIcon className="h-3.5 w-3.5" />
              Tags{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-0" align="start" collisionPadding={8}>
            <div className="p-2 border-b">
              <Input
                placeholder="Tags suchen…"
                className="h-7 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredCategories.map((cat) => (
                <div key={cat.id}>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {cat.name}
                  </div>
                  {cat.tags.map((tag) => {
                    const active = selectedIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggle(tag.id)}
                        className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors ${
                          active ? "bg-accent font-medium" : ""
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color ?? "#888" }}
                        />
                        <span className="flex-1 text-left">{tag.name}</span>
                        {active && (
                          <X className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                  Keine Tags gefunden
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {selectedTags.map((tag) => (
          <TagComponent key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  );
}
