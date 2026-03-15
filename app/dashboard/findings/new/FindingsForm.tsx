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
import { ChevronDown, ImageIcon, Loader2, MapPin, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CldImage } from "next-cloudinary";
import type { Image as ImageType, Tag } from "@prisma/client";
import { toast } from "sonner";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { findingSchemaCompleted, FindingFormData } from "@/schemas/finding";
import TagPicker from "@/components/ui/input/tag-picker/tag-picker";
import ImageDetailDialog from "@/components/images/ImageDetailDialog";

type ImageWithTags = ImageType & { tags?: Tag[] };

interface SessionOption {
  id: string;
  name: string;
  dateFrom: Date;
  dateTo: Date | null;
}

interface Props {
  sessions: SessionOption[];
  tagCategories: TagCategoryWithTags[];
  findingId?: string;
  initialData?: Partial<FindingFormData>;
  initialImages?: ImageType[];
}

export default function FindingsForm({ tagCategories, sessions, findingId, initialData, initialImages }: Props) {
  const LOCAL_STORAGE_KEY = "detektorhub_draft_finding";
  const isEditMode = !!findingId;
  const router = useRouter();

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
    defaultValues: initialData ?? { location: { lat: 51.0504, lng: 13.7373 }, tags: [], images: [] },
  });
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [allImages, setAllImages] = useState<ImageWithTags[]>(initialImages ?? []);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [detailImageId, setDetailImageId] = useState<string | null>(null);

  const selectedImageIds = watch("images") || [];
  const thumbnailId = watch("thumbnailId");
  const watchName = watch("name");

  useEffect(() => {
    if (isEditMode) return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsLoaded(true);
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    const subscription = watch((value) => {
      if (isLoaded) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isLoaded, isEditMode]);

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

  const detailImageIndex = detailImageId ? selectedImageIds.indexOf(detailImageId) : -1;
  const detailImage = detailImageId ? (allImages.find((i) => i.id === detailImageId) ?? null) : null;

  const onSubmit: SubmitHandler<FindingFormData> = async (data) => {
    setLoading(true);

    const res = isEditMode
      ? await fetch(`/api/findings/${findingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      : await fetch("/api/findings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

    setLoading(false);

    if (!res.ok) {
      toast.error(isEditMode ? "Änderungen konnten nicht gespeichert werden." : "Fund konnte nicht gespeichert werden.");
      return;
    }

    if (isEditMode) {
      toast.success("Änderungen gespeichert!");
    } else {
      toast.success("Neuer Fund wurde angelegt!");
      reset();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      router.refresh();
      router.push("/dashboard/findings");
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold truncate mb-3" title={watchName || (isEditMode ? "Fund bearbeiten" : "Neuer Fund")}>
        {watchName || (isEditMode ? "Fund bearbeiten" : "Neuer Fund")}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 min-w-0">
        <Card className="rounded-xl bg-parchment overflow-hidden border border-border">
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

            {/* Funddatum + Fundort in one row */}
            <div className="flex flex-row flex-wrap gap-x-4 gap-y-3 items-end w-full">
              <div className="flex flex-col gap-1.5 shrink-0">
                <Label>Funddatum</Label>
                <DatePicker
                  control={control}
                  name="foundAt"
                  rules={{ required: true }}
                  placeholder="TT.MM.JJJJ"
                />
              </div>
              <LocationPicker
                control={control}
                name="location"
                rules={{ required: true }}
                hideLabel
              />
            </div>

            {/* Location visibility */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-foreground cursor-pointer"
                {...register("locationPublic")}
              />
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Position für andere Nutzer sichtbar
              </span>
            </label>

            {/* Row 2: Tags (full width) */}
            <TagPicker
              control={control}
              tagCategories={tagCategories}
              name="tags"
            />

            {/* Images */}
            <div className="flex flex-col gap-2">
              <Label>Fotos</Label>
              {selectedImageIds.length > 0 && (
                <div className="flex flex-col gap-4">
                  {selectedImageIds.map((id: string) => {
                    const img = allImages.find((i) => i.id === id);
                    const publicId = img?.publicId || id;
                    return (
                      <div key={id} className="relative group rounded-xl border border-border overflow-hidden">
                        {/* Image */}
                        <div
                          className="cursor-zoom-in w-full"
                          onClick={() => setDetailImageId(id)}
                        >
                          <CldImage
                            src={publicId}
                            width={800}
                            height={500}
                            crop="fill"
                            gravity="auto"
                            alt="Ausgewählt"
                            className="w-full object-cover"
                          />
                        </div>

                        {/* Title/description */}
                        {(img?.title || img?.description) && (
                          <div className="px-4 pt-3 pb-2">
                            {img?.title && <p className="font-semibold text-sm">{img.title}</p>}
                            {img?.description && <p className="text-sm text-muted-foreground mt-0.5">{img.description}</p>}
                          </div>
                        )}

                        {/* Titelbild bar */}
                        {thumbnailId === id && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-white py-0.5 px-1 font-bold text-center rounded-b-xl">
                            Titelbild
                          </div>
                        )}

                        {/* Controls */}
                        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            type="button"
                            onClick={() => handleSetCover(id)}
                            className={`p-1.5 rounded-full shadow-md transition-colors ${thumbnailId === id ? "bg-black/70 text-white opacity-100" : "bg-black/50 text-white hover:bg-black/70"}`}
                            title={thumbnailId === id ? "Titelbild (aktiv)" : "Als Titelbild festlegen"}
                          >
                            <Star className={`w-3.5 h-3.5 ${thumbnailId === id ? "fill-current" : ""}`} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(id)}
                          className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
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
                          .catch(() => {});
                      }}
                      onUpload={(image) => setAllImages((prev) => [...prev, image])}
                    />
                  </div>
                  {selectedImageIds.length > 0 && (
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
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Advanced options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Card className="rounded-xl bg-parchment">
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
          className="w-full font-bold transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bitte Warten
            </>
          ) : (
            isEditMode ? "Änderungen speichern" : "Fund Speichern"
          )}
        </Button>
      </form>

      {/* Image detail dialog */}
      <ImageDetailDialog
        image={detailImage}
        onClose={() => setDetailImageId(null)}
        onPrev={() => {
          if (detailImageIndex > 0) setDetailImageId(selectedImageIds[detailImageIndex - 1]);
        }}
        onNext={() => {
          if (detailImageIndex < selectedImageIds.length - 1) setDetailImageId(selectedImageIds[detailImageIndex + 1]);
        }}
        hasPrev={detailImageIndex > 0}
        hasNext={detailImageIndex < selectedImageIds.length - 1}
        onUpdate={(updated) => {
          setAllImages((prev) => prev.map((img) => img.id === updated.id ? updated : img));
        }}
      />
    </>
  );
}
