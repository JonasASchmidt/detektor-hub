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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon, Loader2, X } from "lucide-react";
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Card className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-4 px-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Titel des Fundes"
              required
              {...register("name", { required: true })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Funddatum</Label>
            <DatePicker
              control={control}
              name="foundAt"
              rules={{ required: true }}
              placeholder="TEST"
            />
          </div>
          <LocationPicker
            control={control}
            name="location"
            rules={{ required: true }}
          />
          <TagPicker
            control={control}
            tagCategories={tagCategories}
            name="tags"
          />
        </div>
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-4 px-6 space-y-4">
          <Label>Fotos</Label>
          {selectedImageIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImageIds.map((id: string) => (
                <div key={id} className="relative group w-20 h-20">
                  <CldImage
                    src={allImages.find((img) => img.id === id)?.publicId || id}
                    width={80}
                    height={80}
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
              <Button type="button" variant="outline">
                <ImageIcon className="w-4 h-4 mr-2" />
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
                  // Track images for thumbnails
                  fetch("/api/user-images")
                    .then((r) => r.json())
                    .then(setAllImages)
                    .catch(() => {});
                }}
              />
            </DialogContent>
          </Dialog>
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
                className="w-full"
                {...register("depth")}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="weight">Gewicht [g]</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Gewicht in g"
                className="w-full"
                {...register("weight")}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="diameter">Durchmesser [cm]</Label>
              <Input
                id="diameter"
                type="number"
                placeholder="Durchmesser in cm"
                className="w-full"
                {...register("diameter")}
              />
            </div>
          </div>
          <hr />
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              placeholder="Allgemeine Beschreibung des Fundes."
              id="description"
              {...register("description")}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description_front">Beschreibung Vorderseite</Label>
            <Textarea
              placeholder="Beschreibung der Vorderseite."
              id="description_front"
              {...register("description_front")}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description_back">Beschreibung Rückseite</Label>
            <Textarea
              placeholder="Beschreibung der Rückseite."
              id="description_back"
              {...register("description_back")}
            />
          </div>
          <hr />
          <div className="grid gap-2">
            <Label htmlFor="dating">Datierung (Freitext)</Label>
            <Input
              id="dating"
              type="text"
              placeholder="Datierung des Fundes"
              {...register("dating")}
            />
          </div>
          <div className="flex flex-row gap-6 flex-1">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="dating_from">Datierung ab Jahr</Label>
              <Input
                id="dating_from"
                type="number"
                placeholder="Datierung ab Jahr"
                className="w-full"
                {...register("dating_from")}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="dating_to">Datierung bis Jahr</Label>
              <Input
                id="dating_to"
                type="number"
                placeholder="Datierung bis Jahr"
                className="w-full"
                {...register("dating_to")}
              />
            </div>
          </div>
          <hr />
          <div className="grid w-full gap-1.5">
            <Label htmlFor="references">Referenzen</Label>
            <Textarea
              placeholder="Auflistung der Referenzen"
              id="references"
              {...register("references")}
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
