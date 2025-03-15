"use client";

import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/input/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag } from "@prisma/client";
import { useState } from "react";

interface Props {
  tags: Tag[];
}

export default function FindingsForm({ tags }: Props) {
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
  });

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

  const handleSubmit = () => {};

  return (
    <form className="relative p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
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
              placeholder="Tiefe in cm"
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
              placeholder="Gewicht in g"
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
      </div>
    </form>
  );
}
