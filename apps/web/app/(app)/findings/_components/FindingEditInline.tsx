"use client";

import dynamic from "next/dynamic";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FindingWithRelations } from "@/types/FindingWithRelations";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";
import TagComponent from "@/components/tags/Tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ImageIcon, Loader2, MapPin, Star, Tag as TagIcon, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { findingSchemaCompleted, FindingFormData } from "@/schemas/finding";
import { getInitials } from "@/lib/initials";
import ImageDetailDialog from "@/components/images/ImageDetailDialog";
import ImageGallery from "@/components/images/ImageGallery";
import LocationPicker from "@/components/ui/input/location-picker/location-picker";
import type { Image as ImageType, Tag } from "@prisma/client";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />,
});

type ImageWithTags = ImageType & { tags?: Tag[] };

// Classes shared by all inline editable fields — transparent background, only bottom border on hover/focus
const INLINE =
  "bg-transparent outline-none border-b-2 border-transparent hover:border-foreground/25 focus:border-foreground/40 transition-colors duration-150 rounded-none px-0 w-full";

interface Props {
  finding: FindingWithRelations;
  tagCategories: TagCategoryWithTags[];
  initialImages: ImageType[];
}

export default function FindingEditInline({ finding, tagCategories, initialImages }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [allImages, setAllImages] = useState<ImageWithTags[]>(initialImages);
  const [detailImageId, setDetailImageId] = useState<string | null>(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { control, register, handleSubmit, watch, setValue } = useForm<FindingFormData>({
    resolver: zodResolver(findingSchemaCompleted),
    defaultValues: {
      name: finding.name ?? "",
      location: { lat: finding.latitude ?? 51.0504, lng: finding.longitude ?? 13.7373 },
      description: finding.description ?? undefined,
      foundAt: finding.foundAt,
      tags: finding.tags.map((t) => t.id),
      images: finding.images.map((i) => i.id),
      thumbnailId: finding.thumbnailId ?? undefined,
      depth: finding.depth ?? undefined,
      weight: finding.weight ?? undefined,
      diameter: finding.diameter ?? undefined,
      dating: finding.dating ?? undefined,
      datingFrom: finding.datingFrom ?? undefined,
      datingTo: finding.datingTo ?? undefined,
      references: finding.references ?? undefined,
      locationPublic: finding.locationPublic,
      descriptionFront: finding.descriptionFront ?? undefined,
      descriptionBack: finding.descriptionBack ?? undefined,
    },
  });

  const selectedImageIds = watch("images") || [];
  const thumbnailId = watch("thumbnailId");
  const watchFoundAt = watch("foundAt");
  const watchTags = watch("tags") || [];

  const allTags = tagCategories.flatMap((c) => c.tags);
  const selectedTags = allTags.filter((t) => watchTags.includes(t.id));
  const filteredTagCategories = tagCategories
    .map((cat) => ({
      ...cat,
      tags: cat.tags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase())),
    }))
    .filter((cat) => cat.tags.length > 0);

  const toggleTag = (id: string) => {
    const next = watchTags.includes(id)
      ? watchTags.filter((i: string) => i !== id)
      : [...watchTags, id];
    setValue("tags", next);
  };

  const handleRemoveImage = (id: string) => {
    setValue(
      "images",
      selectedImageIds.filter((i: string) => i !== id),
    );
    if (thumbnailId === id) setValue("thumbnailId", undefined);
  };

  const handleSetCover = (id: string) => {
    setValue("thumbnailId", thumbnailId === id ? undefined : id);
  };

  const detailImageIndex = detailImageId ? selectedImageIds.indexOf(detailImageId) : -1;
  const detailImage = detailImageId ? (allImages.find((i) => i.id === detailImageId) ?? null) : null;

  // Grow textarea to fit its content
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const onSubmit = async (data: FindingFormData) => {
    setLoading(true);
    const res = await fetch(`/api/findings/${finding.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Änderungen konnten nicht gespeichert werden.");
      return;
    }
    toast.success("Änderungen gespeichert!");
    router.push(`/findings/${finding.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="max-w-[720px] mx-auto w-full px-6 pb-10 pt-12 md:px-10 md:pt-16 space-y-6">

        {/* ── Title & meta ───────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Inline h1 */}
          <input
            type="text"
            placeholder="Name des Fundes"
            className={`text-4xl font-bold leading-[1.3] ${INLINE}`}
            {...register("name")}
          />

          {/* Action row — mirrors detail page */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/findings/${finding.id}`)}
              className="h-8 w-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] p-0 transition-all duration-150 ease-in-out"
            >
              <ChevronLeft className="h-8 w-8" strokeWidth={2.5} />
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="ghost"
              className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Speichert…
                </>
              ) : (
                "Änderungen speichern"
              )}
            </Button>
          </div>

          {/* Meta row — date clickable, author read-only */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ml-0">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-sm text-muted-foreground border-b-2 border-transparent hover:border-foreground/25 transition-colors duration-150 outline-none"
                >
                  {watchFoundAt
                    ? format(new Date(watchFoundAt), "d. MMMM yy", { locale: de })
                    : "Datum wählen"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watchFoundAt ? new Date(watchFoundAt) : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setValue("foundAt", d);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {finding.user?.name && (
              <span className="flex items-center gap-1.5">
                <Avatar className="h-6 w-6 rounded-full shrink-0">
                  <AvatarImage
                    src={finding.user.image ?? undefined}
                    alt={finding.user.name}
                  />
                  <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[9px] font-bold">
                    {getInitials(finding.user.name)}
                  </AvatarFallback>
                </Avatar>
                <Link href={`/profile/${finding.user.id}`} className="hover:underline">
                  {finding.user.name}
                </Link>
              </span>
            )}
          </div>

          {/* Tags row — pills + add-tag button */}
          <div className="flex gap-1.5 flex-wrap items-center pt-1">
            {selectedTags.map((tag) => (
              <TagComponent key={tag.id} tag={tag} large onClose={() => toggleTag(tag.id)} />
            ))}
            <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60 border-b-2 border-transparent hover:border-foreground/25 hover:text-muted-foreground transition-colors duration-150 pb-0.5 outline-none"
                >
                  <TagIcon className="h-3 w-3" />
                  Tag hinzufügen
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="start" collisionPadding={8}>
                <div className="p-2 border-b">
                  <input
                    className="w-full h-7 text-xs bg-transparent outline-none border-b border-input px-1"
                    placeholder="Tags suchen…"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {filteredTagCategories.map((cat) => (
                    <div key={cat.id}>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {cat.name}
                      </div>
                      {cat.tags.map((tag) => {
                        const active = watchTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors ${active ? "bg-accent font-medium" : ""}`}
                          >
                            <span className="flex-1 text-left">{tag.name}</span>
                            {active && <X className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {filteredTagCategories.length === 0 && (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                      Keine Tags gefunden
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ── Description ────────────────────────────────────────────── */}
        <textarea
          placeholder="Beschreibung des Fundes…"
          rows={3}
          className={`text-base leading-relaxed text-foreground/90 resize-none ${INLINE}`}
          {...register("description")}
          onInput={(e) => autoResize(e.currentTarget)}
        />

        {/* ── Details card ───────────────────────────────────────────── */}
        <Card className="bg-muted p-6 space-y-4 border-black/[0.05] rounded-lg">
          <h2 className="text-xl font-bold">Details</h2>

          {/* Measurements */}
          <div className="flex flex-row gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <Label htmlFor="depth">Fundtiefe [cm]</Label>
              <Input id="depth" type="number" placeholder="Tiefe" {...register("depth")} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <Label htmlFor="weight">Gewicht [g]</Label>
              <Input id="weight" type="number" placeholder="Gewicht" {...register("weight")} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <Label htmlFor="diameter">Durchmesser [cm]</Label>
              <Input id="diameter" type="number" placeholder="Durchmesser" {...register("diameter")} />
            </div>
          </div>

          {/* Dating */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dating">Datierung (Freitext)</Label>
            <Input id="dating" type="text" placeholder="z. B. Mittelalter, ca. 1200–1400" {...register("dating")} />
          </div>
          <div className="flex flex-row gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <Label htmlFor="datingFrom">Datierung ab</Label>
              <Input id="datingFrom" type="number" placeholder="Jahr von" {...register("datingFrom")} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
              <Label htmlFor="datingTo">Datierung bis</Label>
              <Input id="datingTo" type="number" placeholder="Jahr bis" {...register("datingTo")} />
            </div>
          </div>

          {/* Vorderseite */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descriptionFront">Vorderseite</Label>
            <Textarea id="descriptionFront" placeholder="Beschreibung Vorderseite…" rows={3} {...register("descriptionFront")} />
          </div>

          {/* Rückseite */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descriptionBack">Rückseite</Label>
            <Textarea id="descriptionBack" placeholder="Beschreibung Rückseite…" rows={3} {...register("descriptionBack")} />
          </div>

          {/* Referenzen */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="references">Referenzen</Label>
            <Textarea id="references" placeholder="Auflistung der Referenzen" rows={3} {...register("references")} />
          </div>
        </Card>

        {/* ── Location ───────────────────────────────────────────────── */}
        {finding.latitude != null && finding.longitude != null && (
          <div className="relative rounded-lg overflow-hidden h-48 group">
            <FindingDetailMap
              latitude={finding.latitude}
              longitude={finding.longitude}
            />
            <button
              type="button"
              onClick={() => setLocationDialogOpen(true)}
              className="absolute bottom-2 right-2 z-[1000] bg-white/90 hover:bg-white text-sm font-medium rounded-md px-2.5 py-1 shadow flex items-center gap-1.5 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              Standort bearbeiten
            </button>
          </div>
        )}

        {/* Location public toggle */}
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

        {/* ── Images ─────────────────────────────────────────────────── */}
        <div className="space-y-4 pt-2">
          {selectedImageIds.length > 0 && (
            <div className="flex flex-col gap-4">
              {selectedImageIds.map((id: string) => {
                const img = allImages.find((i) => i.id === id);
                const publicId = img?.publicId || id;
                return (
                  <div
                    key={id}
                    className="relative group rounded-lg border border-black/[0.05] overflow-hidden"
                  >
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

                    {(img?.title || img?.description) && (
                      <div className="px-4 pt-3 pb-2">
                        {img?.title && (
                          <p className="font-semibold text-sm">{img.title}</p>
                        )}
                        {img?.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {img.description}
                          </p>
                        )}
                      </div>
                    )}

                    {thumbnailId === id && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-white py-0.5 px-1 font-bold text-center rounded-b-lg">
                        Titelbild
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={() => handleSetCover(id)}
                        className={`p-1.5 rounded-full shadow-md transition-colors ${thumbnailId === id ? "bg-black/70 text-white opacity-100" : "bg-black/50 text-white hover:bg-black/70"}`}
                        title={thumbnailId === id ? "Titelbild (aktiv)" : "Als Titelbild festlegen"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${thumbnailId === id ? "fill-current" : ""}`}
                        />
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

          {/* Open gallery */}
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border-b-2 border-transparent hover:border-foreground/25 transition-colors duration-150 outline-none pb-0.5"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {selectedImageIds.length > 0
              ? `${selectedImageIds.length} Fotos · Bearbeiten`
              : "Fotos hinzufügen"}
          </button>
        </div>
      </div>

      {/* ── Location picker dialog ─────────────────────────────────── */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Standort bearbeiten</DialogTitle>
          </DialogHeader>
          <LocationPicker control={control as never} name="location" />
          <Button
            type="button"
            onClick={() => setLocationDialogOpen(false)}
            className="mt-2 w-full"
          >
            Standort übernehmen
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Gallery dialog ─────────────────────────────────────────── */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Deine Bilder</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <ImageGallery
              selected={selectedImageIds}
              onSelect={(ids) => {
                setValue("images", ids);
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

      {/* ── Image detail dialog ────────────────────────────────────── */}
      <ImageDetailDialog
        image={detailImage}
        onClose={() => setDetailImageId(null)}
        onPrev={() => {
          if (detailImageIndex > 0) setDetailImageId(selectedImageIds[detailImageIndex - 1]);
        }}
        onNext={() => {
          if (detailImageIndex < selectedImageIds.length - 1)
            setDetailImageId(selectedImageIds[detailImageIndex + 1]);
        }}
        hasPrev={detailImageIndex > 0}
        hasNext={detailImageIndex < selectedImageIds.length - 1}
        onUpdate={(updated) => {
          setAllImages((prev) =>
            prev.map((img) => (img.id === updated.id ? updated : img)),
          );
        }}
      />
    </form>
  );
}
