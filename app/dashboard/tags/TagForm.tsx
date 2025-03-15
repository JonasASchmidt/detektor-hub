"use client";

import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tag, TagCategory } from "@prisma/client";
import IconPicker from "../../../components/ui/input/icon-picker";
import ColorPicker from "../../../components/ui/input/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import TagComponent from "../../../components/tags/Tag";
import { toast } from "sonner";

interface Props {
  initialTag?: Tag;
  onAddTag: (tag: Tag) => void;
  onUpdateTag: (tag: Tag) => void;
  resetTag: () => void;
  tagCategories: TagCategory[];
}

export function TagForm({
  initialTag,
  onAddTag,
  onUpdateTag,
  resetTag,
  tagCategories,
}: Props) {
  const [formData, setFormData] = useState({
    category: initialTag?.categoryId ?? "",
    color: initialTag?.color ?? "",
    name: initialTag?.name ?? "",
    icon: initialTag?.icon ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      category: initialTag?.categoryId ?? "",
      color: initialTag?.color ?? "",
      name: initialTag?.name ?? "",
      icon: initialTag?.icon ?? "",
    });
  }, [initialTag]);

  const clearForm = () => {
    resetTag();
    setFormData({
      category: "",
      color: "#ffffff",
      name: "",
      icon: "",
    });
  };

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

    toast.success("Tag wurde gespeichert!");
    onAddTag(data.tag);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialTag) {
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: initialTag?.id,
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

    toast.success("Tag wurde gespeichert!");
    onUpdateTag(data.tag);
  };

  return (
    <form
      className="relative p-6 md:p-8"
      onSubmit={initialTag ? handleUpdate : handleSubmit}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">
            {initialTag ? "Tag Bearbeiten" : "Neuer Tag"}
          </Label>
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
          <Select
            onValueChange={handleChangeCategory}
            value={formData.category}
          >
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
        <ColorPicker onChange={handleChangeColor} value={formData.color} />
        <IconPicker onChange={handleChangeIcon} value={formData.icon} />{" "}
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
        <div className="flex gap-2">
          {initialTag && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={clearForm}
            >
              Abbrechen
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Bitte warten
              </>
            ) : initialTag ? (
              "Speichern"
            ) : (
              "Hinzufügen"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
