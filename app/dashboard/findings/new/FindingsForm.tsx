"use client";

import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import ImageGallery from "@/components/images/ImageGallery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/input/date-picker";
import LocationPicker from "@/components/ui/input/location-picker/location-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ImageIcon, Loader2, Star, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { CldImage } from "next-cloudinary";
import type { Image as ImageType } from "@prisma/client";
import { toast } from "sonner";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { findingSchemaCompleted, FindingFormData } from "@/schemas/finding";
import TagPicker from "@/components/ui/input/tag-picker/tag-picker";

interface SessionOption {
  id: string;
  name: string;
  dateFrom: Date;
  dateTo: Date | null;
}

interface Props {
  tagCategories: TagCategoryWithTags[];
  sessions: SessionOption[];
}

export default function FindingsForm({ tagCategories, sessions }: Props) {
  const LOCAL_STORAGE_KEY = "detektorhub_draft_finding";

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors: _errors, isSubmitting: _isSubmitting },
  } = useForm<FindingFormData>({
    resolver: zodResolver(findingSchemaCompleted),
    defaultValues: { location: { lat: 51.0504, lng: 13.7373 }, tags: [], images: [] },
  });
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [allImages, setAllImages] = useState<ImageType[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ publicId: string; url: string } | null>(null);

  const selectedImageIds = watch("images") || [];
  const thumbnailId = watch("thumbnailId");
  const watchName = watch("name");

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          reset(parsed);
        }
      } catch (e) { }
    }
    setIsLoaded(true);
  }, [reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (isLoaded) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isLoaded]);

  const handleChangeImages = (ids: string[]) => setValue("images", ids);

  const handleRemoveImage = (id: string) => {
    setValue("images", selectedImageIds.filter((i: string) => i !== id));
    if (thumbnailId === id) {
      setValue("thumbnailId", undefined);
    }
  };

  const handleSetCover = (id: string) => {
    setValue("thumbnailId", thumbnailId === id ? undefined : id);
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
    reset();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <TooltipProvider>
      <h1 className="text-4xl font-bold truncate mb-3" title={watchName || "Neuer Fund"}>
        {watchName || "Neuer Fund"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 min-w-0">
        <Card className="bg-white dark:bg-gray-900 overflow-hidden border border-border">
          <div className="py-6 px-6 space-y-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Titel des Fundes"
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

            {/* Begehung */}
            {sessions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fieldSessionId">Begehung (optional)</Label>
                <select
                  id="fieldSessionId"
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  {...register("fieldSessionId")}
                >
                  <option value="">— keine Begehung —</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Small fields: Funddatum, Tags, Location */}
            <div className="flex flex-row flex-wrap gap-x-4 gap-y-3 items-end w-full justify-between">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedImageIds.map((id: string) => {
                    const img = allImages.find((i) => i.id === id);
                    const publicId = img?.publicId || id;
                    const url = img?.url || "";
                    return (
                      <div key={id} className="relative group aspect-square">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="w-full h-full cursor-zoom-in overflow-hidden rounded-xl border border-border"
                              onClick={() => setPreviewImage({ publicId, url })}
                            >
                              <CldImage
                                src={publicId}
                                width={300}
                                height={300}
                                crop="fill"
                                gravity="auto"
                                alt="Ausgewählt"
                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-800 text-white shadow-xl">
                            <div className="flex flex-col gap-0.5">
                              <p className="font-medium truncate max-w-[200px]">{img?.originalFilename || "Unbekannt"}</p>
                              <p className="text-[10px] text-zinc-400">
                                {img?.width && img?.height ? `${img.width} × ${img.height} px` : "Keine Auflösung"}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        <div className="absolute top-1 left-1 flex gap-1 transition-opacity opacity-0 group-hover:opacity-100 z-10">
                          <button
                            type="button"
                            onClick={() => handleSetCover(id)}
                            className={`p-1 rounded-full shadow-md transition-colors ${thumbnailId === id ? "bg-amber-500 text-white opacity-100" : "bg-black/50 text-white hover:bg-black/70"
                              }`}
                            title={thumbnailId === id ? "Titelbild (aktiv)" : "Als Titelbild festlegen"}
                          >
                            <Star className={`w-3.5 h-3.5 ${thumbnailId === id ? "fill-current" : ""}`} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(id)}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {thumbnailId === id && (
                          <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-[10px] text-white py-0.5 px-1 font-bold text-center">
                            Titelbild
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-auto border-2 border-foreground text-foreground hover:bg-zinc-800 hover:text-white hover:border-zinc-800 font-bold px-3 transition-all"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Bilder auswählen ({selectedImageIds.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Deine Bilder</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-1">
                    <ImageGallery
                      selected={selectedImageIds}
                      onSelect={(ids) => {
                        handleChangeImages(ids);
                        fetch("/api/user-images")
                          .then((r) => r.json())
                          .then(setAllImages)
                          .catch(() => { });
                      }}
                    />
                  </div>
                    <div className="pt-4 border-t border-border mt-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="w-full border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold px-3 transition-all duration-150 ease-in-out"
                        onClick={() => setGalleryOpen(false)}
                      >
                        {selectedImageIds.length} Fotos übernehmen
                      </Button>
                    </div>
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
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <Label htmlFor="depth">Fundtiefe [cm]</Label>
                    <Input
                      id="depth"
                      type="number"
                      placeholder="Tiefe"
                      className="w-full"
                      {...register("depth")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <Label htmlFor="weight">Gewicht [g]</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Gewicht"
                      className="w-full"
                      {...register("weight")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <Label htmlFor="diameter">Durchmesser [cm]</Label>
                    <Input
                      id="diameter"
                      type="number"
                      placeholder="Durchmesser"
                      className="w-full"
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
                    {...register("dating")}
                  />
                </div>
                <div className="flex flex-row gap-4 flex-wrap">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <Label htmlFor="dating_from">Datierung ab</Label>
                    <Input
                      id="dating_from"
                      type="number"
                      placeholder="Jahr von"
                      className="w-full"
                      {...register("dating_from")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <Label htmlFor="dating_to">Datierung bis</Label>
                    <Input
                      id="dating_to"
                      type="number"
                      placeholder="Jahr bis"
                      className="w-full"
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
        <Button 
          type="submit" 
          disabled={loading}
          variant="ghost"
          size="lg"
          className="w-full border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold px-3 transition-all duration-150 ease-in-out"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bitte warten
            </>
          ) : (
            "Fund Speichern"
          )}
        </Button>
      </form>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 flex items-center justify-center bg-black/90 border-none">
          {previewImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <CldImage
                src={previewImage.publicId}
                width={1920}
                height={1080}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                priority
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                title="Schließen"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
