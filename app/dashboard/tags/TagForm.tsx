"use client";

import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Tag, TagCategory } from "@prisma/client";
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
    color: initialTag?.color ?? `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    name: initialTag?.name ?? "",
    icon: initialTag?.icon ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      category: initialTag?.categoryId ?? "",
      color: initialTag?.color ?? `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      name: initialTag?.name ?? "",
      icon: initialTag?.icon ?? "",
    });
  }, [initialTag]);

  const clearForm = () => {
    resetTag();
    setFormData({
      category: "",
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
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
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {initialTag ? "Tag bearbeiten" : "Neuen Tag erstellen"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Definiere Name, Farbe und Icon für eine einfache Kategorisierung deiner Funde.
          </p>
        </header>

        <div className="flex flex-wrap items-end gap-2 md:gap-3">
          <div className="flex-1 min-w-[100px] space-y-1.5 focus-within:z-10">
            <Label htmlFor="name" className="text-[10px] font-bold ml-1 uppercase text-muted-foreground tracking-wider whitespace-nowrap opacity-70">Tag Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="z.B. Münze..."
              value={formData.name}
              onChange={handleChange}
              className="bg-white hover:bg-white border-black/[0.05] focus-visible:ring-black/10"
              required
            />
          </div>

          <div className="flex-1 min-w-[100px] space-y-1.5 focus-within:z-10">
            <Label htmlFor="category" className="text-[10px] font-bold ml-1 uppercase text-muted-foreground tracking-wider whitespace-nowrap opacity-70">Kategorie</Label>
            <Select
              onValueChange={handleChangeCategory}
              value={formData.category}
            >
              <SelectTrigger id="category" className="bg-white hover:bg-white border-black/[0.05]">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-black/[0.05] shadow-xl">
                {tagCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="cursor-pointer">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="shrink-0 space-y-1.5">
            <Label className="text-[10px] font-bold ml-1 uppercase text-muted-foreground tracking-wider whitespace-nowrap opacity-70">Farbe</Label>
            <div className="h-8 flex items-center">
              <ColorPicker onChange={handleChangeColor} value={formData.color} />
            </div>
          </div>
          
          <div className="shrink-0 space-y-1.5">
            <Label className="text-[10px] font-bold ml-1 uppercase text-muted-foreground tracking-wider whitespace-nowrap opacity-70">Icon</Label>
            <div className="h-8 flex items-center">
              <IconPicker onChange={handleChangeIcon} value={formData.icon} />
            </div>
          </div>

          <div className="shrink-0 space-y-1.5 ml-2">
            <Label className="text-[10px] font-bold ml-1 uppercase text-muted-foreground tracking-wider whitespace-nowrap opacity-70">Vorschau</Label>
            <div className="h-8 flex items-center">
              <TagComponent 
                tag={{ ...formData, name: formData.name || "TAG NAME" } as any} 
                className="!h-8 rounded text-sm font-bold px-4 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-3 pt-2">
          {initialTag && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-2 hover:bg-muted font-bold transition-all"
              onClick={clearForm}
            >
              Abbrechen
            </Button>
          )}
          <Button 
            type="submit" 
            className={`flex-1 font-bold transition-all shadow-sm ${
              initialTag 
                ? "bg-black text-white hover:bg-black/90" 
                : "bg-primary text-primary-foreground hover:scale-[1.01]"
            }`} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Speichere...
              </>
            ) : initialTag ? (
              "Änderungen speichern"
            ) : (
              "Tag erstellen"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
