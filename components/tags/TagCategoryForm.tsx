"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TagCategory } from "@prisma/client";

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
          <Label htmlFor="email">Neue Kategorie</Label>
          <Input
            id="name"
            type="text"
            placeholder="Bezeichnung der Kategorie"
            value={formData.name}
            onChange={handleChange}
            required
          />
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
