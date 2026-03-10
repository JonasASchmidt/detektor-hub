"use client";

import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import ImageGallery from "@/components/image-gallery/ImageGallery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/input/date-picker";
import LocationPicker from "@/components/ui/input/location-picker/location-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { Image as ImageType } from "@prisma/client";
import { toast } from "sonner";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { findingSchemaCompleted, FindingFormData } from "@/schemas/finding";
import TagPicker from "@/components/ui/input/tag-picker/tag-picker";

interface Props {
  tagCategories: TagCategoryWithTags[];
}

export default function FindingsForm({ tagCategories }: Props) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: _errors, isSubmitting: _isSubmitting },
  } = useForm<FindingFormData>({
    resolver: zodResolver(findingSchemaCompleted),
    defaultValues: { location: { lat: 51, lng: 13 }, tags: [], images: [] },
  });
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [allImages, setAllImages] = useState<ImageType[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedImageIds = watch("images") || [];

  const handleChangeImages = (ids: string[]) => setValue("images", ids);

  const handleRemoveImage = (id: string) => {
    setValue("images", selectedImageIds.filter((i: string) => i !== id));
  };

  const onSubmit: SubmitHandler<FindingFormData> = async (data) => {
    setLoading(true);

    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      toast.error("Fund konnte nicht gespeichert werden.");
      return;
    }

    toast.success("Neuer Fund wurde angelegt!");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Card className="bg-white dark:bg-gray-900">
        <div className="py-6 px-6 space-y-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Titel des Fundes"
              className="h-8"
              required
              {...register("name", { required: true })}
            />
          </div>

          {/* Beschreibung */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Allgemeine Beschreibung des Fundes (Vorder-/Rückseite, Besonderheiten …)"
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Row 1: Funddatum + Tags */}
          <div className="flex flex-row flex-wrap gap-x-4 gap-y-3 items-end">
            <div className="flex flex-col gap-1.5">
              <Label>Funddatum</Label>
              <DatePicker
                control={control}
                name="foundAt"
                rules={{ required: true }}
                placeholder="TT.MM.JJJJ"
              />
            </div>
            <TagPicker
              control={control}
              tagCategories={tagCategories}
              name="tags"
            />
          </div>

          {/* Row 2: Fundort icon + Lat + Lng */}
          <div className="flex flex-row flex-wrap gap-x-4 gap-y-3 items-end">
            <LocationPicker
              control={control}
              name="location"
              rules={{ required: true }}
            />
          </div>

          {/* Images */}
          <div className="flex flex-col gap-2">
            <Label>Fotos</Label>
            {selectedImageIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedImageIds.map((id: string) => (
                  <div key={id} className="relative group w-16 h-16">
                    <CldImage
                      src={allImages.find((img) => img.id === id)?.publicId || id}
                      width={64}
                      height={64}
                      crop="fill"
                      gravity="auto"
                      alt="Ausgewählt"
                      className="rounded-md object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(id)}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-auto">
                  <ImageIcon className="w-4 h-4" />
                  Bilder auswählen ({selectedImageIds.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bilder aus Galerie wählen</DialogTitle>
                </DialogHeader>
                <ImageGallery
                  selected={selectedImageIds}
                  onSelect={(ids) => {
                    handleChangeImages(ids);
                    fetch("/api/user-images")
                      .then((r) => r.json())
                      .then(setAllImages)
                      .catch(() => {});
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Advanced options */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <Card className="bg-white dark:bg-gray-900">
          <div className="py-4 px-6">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-xl font-bold hover:text-foreground/80 transition-colors w-full text-left"
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
                />
                Erweiterte Optionen
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="pb-5 px-6 space-y-4">
              {/* Measurements */}
              <div className="flex flex-row gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="depth">Fundtiefe [cm]</Label>
                  <Input
                    id="depth"
                    type="number"
                    placeholder="Tiefe"
                    className="h-8 w-28"
                    {...register("depth")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="weight">Gewicht [g]</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Gewicht"
                    className="h-8 w-28"
                    {...register("weight")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="diameter">Durchmesser [cm]</Label>
                  <Input
                    id="diameter"
                    type="number"
                    placeholder="Durchmesser"
                    className="h-8 w-28"
                    {...register("diameter")}
                  />
                </div>
              </div>

              <hr />

              {/* Dating */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dating">Datierung (Freitext)</Label>
                <Input
                  id="dating"
                  type="text"
                  placeholder="z. B. Mittelalter, ca. 1200–1400"
                  className="h-8"
                  {...register("dating")}
                />
              </div>
              <div className="flex flex-row gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dating_from">Datierung ab</Label>
                  <Input
                    id="dating_from"
                    type="number"
                    placeholder="Jahr von"
                    className="h-8 w-28"
                    {...register("dating_from")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dating_to">Datierung bis</Label>
                  <Input
                    id="dating_to"
                    type="number"
                    placeholder="Jahr bis"
                    className="h-8 w-28"
                    {...register("dating_to")}
                  />
                </div>
              </div>

              <hr />

              {/* References */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="references">Referenzen</Label>
                <Textarea
                  placeholder="Auflistung der Referenzen"
                  id="references"
                  rows={3}
                  {...register("references")}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Submit */}
      {loading ? (
        <Button disabled>
          <Loader2 className="animate-spin" />
          Bitte Warten
        </Button>
      ) : (
        <Button type="submit" className="w-full">
          Fund Speichern
        </Button>
      )}
    </form>
  );
}
