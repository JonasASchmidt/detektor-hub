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
    <form className="relative p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Neue Kategorie erstellen</h2>
          <p className="text-sm text-muted-foreground">
            Erstelle Kategorien, um Tags zu gruppieren und Funde systematisch zu organisieren.
          </p>
        </header>

        <div className="grid gap-2">
          <Label htmlFor="name" className="text-[10px] font-bold ml-1 uppercase text-muted-foreground tracking-wider whitespace-nowrap opacity-70">Kategorie Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="z.B. Epoche, Material, Erhaltung..."
            value={formData.name}
            onChange={handleChange}
            className="bg-white hover:bg-white border-black/[0.05] focus-visible:ring-black/10"
            required
          />
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1 font-bold transition-all shadow-sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Speichere...
              </>
            ) : (
              "Kategorie erstellen"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
