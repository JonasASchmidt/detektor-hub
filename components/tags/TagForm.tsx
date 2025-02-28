"use client";

import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tag, TagCategory } from "@prisma/client";
import IconPicker from "../ui/input/icon-picker";
import ColorPicker from "../ui/input/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import TagComponent from "./Tag";

interface Props {
  onAddTag: (tag: Tag) => void;
  tagCategories: TagCategory[];
}

export function TagForm({ onAddTag, tagCategories }: Props) {
  const [formData, setFormData] = useState({
    category: "",
    color: "",
    name: "",
    icon: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleChangeCategory = (category: string) =>
    setFormData({ ...formData, category });

  const handleChangeColor = (color: string) =>
    setFormData({ ...formData, color });

  const handleChangeIcon = (icon: keyof typeof LucideIcons) =>
    setFormData({ ...formData, icon });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        color: formData.color,
        icon: formData.icon,
        category: formData.category,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Fehler beim Erstellen des Tags.");
      return;
    }

    onAddTag(data.tag);
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Neuer Tag</Label>
          <Input
            id="name"
            type="text"
            placeholder="Bezeichnung des Tags"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Kategorie</Label>
          <Select onValueChange={handleChangeCategory}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              {tagCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ColorPicker onChange={handleChangeColor} />
        <IconPicker onChange={handleChangeIcon} />{" "}
        <div className="space-y-2">
          <Label htmlFor="category">Vorschau</Label>

          <div className="w-full text-center">
            <TagComponent tag={formData} />
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <Button disabled>
            <Loader2 className="animate-spin" />
            Bitte warten
          </Button>
        ) : (
          <Button type="submit" className="w-full">
            Hinzufügen
          </Button>
        )}
      </div>
    </form>
  );
}
