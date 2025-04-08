"use client";

import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import ImageGallery from "@/components/image-gallery/ImageGallery";
import TagSelect from "@/components/tags/TagSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/input/date-picker";
import LocationPicker from "@/components/ui/input/location-picker/location-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  tagCategories: TagCategoryWithTags[];
}

export default function FindingsForm({ tagCategories }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    latitude: 0,
    longitude: 0,
    depth: 0,
    weight: 0,
    diameter: 0,
    description: "",
    description_front: "",
    description_back: " ",
    dating: "",
    dating_from: 0,
    dating_to: 0,
    references: "",
    thumbnailUrl: "",
    foundAt: new Date(),
    selectedTags: [] as Tag[],
    images: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleChangeDate = (date?: Date) => {
    setFormData({
      ...formData,
      foundAt: date ?? new Date(),
    });
  };

  const handleChangeLocation = () => {};

  const handleChangeTags = (tags: Tag[]) => {
    setFormData({
      ...formData,
      selectedTags: tags,
    });
  };

  const handleChangeImages = (ids: string[]) =>
    setFormData({
      ...formData,
      images: ids,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    console.log(res);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Card className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-4 px-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Titel des Fundes"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Funddatum</Label>
            <DatePicker value={formData.foundAt} onChange={handleChangeDate} />
          </div>
          <LocationPicker
            id="location"
            onChange={handleChangeLocation}
            value={{
              lat: 51,
              lng: 13,
            }}
          />
          <div className="grid gap-2">
            <Label htmlFor="name">Tags</Label>
            <TagSelect
              tagCategories={tagCategories}
              onChange={handleChangeTags}
              placeholder={"Tags auswählen ..."}
              selected={formData.selectedTags}
            />
          </div>
        </div>
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-4 px-6 space-y-4">
          <Label htmlFor="name">Fotos</Label>
          <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
            Hier können dem Fund Bilder aus Ihrer Gallerie zugeordnet werden.
          </p>
          <ImageGallery
            selected={formData.images}
            onSelect={handleChangeImages}
          />
        </div>
      </Card>
      <Card className="bg-white dark:bg-gray-900 relative p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-row gap-6 flex-1">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="depth">Fundtiefe [cm]</Label>
              <Input
                id="depth"
                type="number"
                placeholder="Tiefe in cm"
                value={formData.depth}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="weight">Gewicht [g]</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Gewicht in g"
                value={formData.weight}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="diameter">Durchmesser [cm]</Label>
              <Input
                id="diameter"
                type="number"
                placeholder="Durchmesser in cm"
                value={formData.diameter}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
          <hr />
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              placeholder="Allgemeine Beschreibung des Fundes."
              id="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description_front">Beschreibung Vorderseite</Label>
            <Textarea
              placeholder="Beschreibung der Vorderseite."
              id="description_front"
              value={formData.description_front}
              onChange={handleChange}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description_back">Beschreibung Rückseite</Label>
            <Textarea
              placeholder="Beschreibung der Rückseite."
              id="description_back"
              value={formData.description_back}
              onChange={handleChange}
            />
          </div>
          <hr />
          <div className="grid gap-2">
            <Label htmlFor="dating">Datierung (Freitext)</Label>
            <Input
              id="dating"
              type="text"
              placeholder="Datierung des Fundes"
              value={formData.dating}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-row gap-6 flex-1">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="dating_from">Datierung ab Jahr</Label>
              <Input
                id="dating_from"
                type="number"
                placeholder="Datierung ab Jahr"
                value={formData.dating_from}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="dating_to">Datierung bis Jahr</Label>
              <Input
                id="dating_to"
                type="number"
                placeholder="Datierung bis Jahr"
                value={formData.dating_to}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
          <hr />
          <div className="grid w-full gap-1.5">
            <Label htmlFor="references">Referenzen</Label>
            <Textarea
              placeholder="Auflistung der Referenzen"
              id="references"
              value={formData.references}
              onChange={handleChange}
            />
          </div>
          {loading ? (
            <Button disabled>
              <Loader2 className="animate-spin" />
              Bitte Warten
            </Button>
          ) : (
            <Button type="submit" className="w-full">
              Speichern
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
