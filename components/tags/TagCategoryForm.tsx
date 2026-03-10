"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TagCategory } from "@prisma/client";

interface Props {
  category?: TagCategory;
  onAddCategory: (tagCategory: TagCategory) => void;
}

export function TagCategoryForm({ category, onAddCategory }: Props) {
  const [formData, setFormData] = useState({
    name: category?.name ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/tag-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formData.name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Fehler beim Erstellen der Kategorie.");
      return;
    }

    console.log(data);

    onAddCategory(data.category);
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-sm font-semibold ml-1">Neue Kategorie</Label>
          <Input
            id="name"
            type="text"
            placeholder="z.B. Epoche, Material, Erhaltung..."
            value={formData.name}
            onChange={handleChange}
            className="h-10 rounded-xl bg-muted/30 border-black/[0.05] focus-visible:ring-black/10"
            required
          />
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button 
          type="submit" 
          disabled={loading}
          variant="ghost"
          className="w-full h-11 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bitte warten
            </>
          ) : (
            "Kategorie hinzufügen"
          )}
        </Button>
      </div>
    </form>
  );
}
