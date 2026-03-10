"use client";

import dynamic from "next/dynamic";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import TagComponent from "@/components/tags/Tag";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
  ),
});

interface Props {
  finding: FindingWithRelations;
}

export default function FindingDetail({ finding }: Props) {
  const router = useRouter();
  if (!finding) return null;

  const images = finding.images ?? [];
  const hasDetails =
    finding.depth || finding.weight || finding.diameter ||
    finding.dating || finding.dating_from || finding.dating_to ||
    finding.references || finding.description_front || finding.description_back;

  return (
    <div className="max-w-[720px] mx-auto w-full px-6 pb-10 pt-12 md:px-10 md:pt-16 space-y-6">

      {/* Title & meta */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 -ml-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg flex items-center justify-center p-0"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={3} />
          </Button>
          <h1 className="text-4xl font-bold leading-none">{finding.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ml-0">
          <span>{format(new Date(finding.foundAt ?? finding.createdAt), "d. MMMM yyyy", { locale: de })}</span>
          {finding.user?.name && (
            <>
              <span>·</span>
              <span>{finding.user.name}</span>
            </>
          )}
        </div>
        {finding.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {finding.tags.map((tag) => (
              <TagComponent key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {finding.description && (
        <p className="text-base leading-relaxed text-foreground/90">{finding.description}</p>
      )}




      {/* Map */}
      <div className="rounded-lg overflow-hidden h-48">
        <FindingDetailMap
          latitude={finding.latitude}
          longitude={finding.longitude}
        />
      </div>

      {/* Details */}
      {hasDetails && (
        <Card className="bg-white p-6 space-y-4 shadow-sm border-black/[0.05] rounded-lg">
          <h2 className="text-xl font-bold">Details</h2>

          {(finding.depth || finding.weight || finding.diameter) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {finding.depth && <span><span className="text-muted-foreground">Tiefe</span> {finding.depth} cm</span>}
              {finding.weight && <span><span className="text-muted-foreground">Gewicht</span> {finding.weight} g</span>}
              {finding.diameter && <span><span className="text-muted-foreground">Durchmesser</span> {finding.diameter} cm</span>}
            </div>
          )}

          {(finding.dating || finding.dating_from || finding.dating_to) && (
            <div className="text-sm space-y-0.5">
              {finding.dating && <p>{finding.dating}</p>}
              {(finding.dating_from || finding.dating_to) && (
                <p className="text-muted-foreground">
                  {finding.dating_from ?? "?"} – {finding.dating_to ?? "?"}
                </p>
              )}
            </div>
          )}

          {finding.description_front && (
            <div className="text-sm space-y-0.5">
              <p className="font-medium text-muted-foreground">Vorderseite</p>
              <p>{finding.description_front}</p>
            </div>
          )}

          {finding.description_back && (
            <div className="text-sm space-y-0.5">
              <p className="font-medium text-muted-foreground">Rückseite</p>
              <p>{finding.description_back}</p>
            </div>
          )}

          {finding.references && (
            <div className="text-sm space-y-0.5">
              <p className="font-medium text-muted-foreground">Referenzen</p>
              <p className="whitespace-pre-line">{finding.references}</p>
            </div>
          )}
        </Card>
      )}

      {/* Edit Action */}
      <div className="pt-2">
        <Button
          variant="ghost"
          className="w-full h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
          onClick={() => router.push(`/dashboard/findings/${finding.id}/edit`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Fund Bearbeiten
        </Button>
      </div>

      {/* Images list */}
      {images.length > 0 && (
        <div className="space-y-4 pt-2">
          {images.map((image, i) => (
            <a
              key={image.id}
              href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${image.publicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-zoom-in rounded-lg overflow-hidden bg-muted group border border-black/[0.05]"
            >
              <CldImage
                src={image.publicId}
                width={1440}
                height={960}
                crop="fill"
                gravity="auto"
                alt={image.title || `Bild ${i + 1}`}
                format="auto"
                quality="auto"
                className="w-full object-cover transition-transform group-hover:scale-[1.01] duration-500"
              />
              {(image.originalFilename || image.fileSize || image.width) && (
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground px-1 pt-2 pb-1">
                  {image.originalFilename && <span>{image.originalFilename}</span>}
                  {image.fileSize && (
                    <span>
                      {image.fileSize < 1024 * 1024
                        ? `${(image.fileSize / 1024).toFixed(1)} KB`
                        : `${(image.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  )}
                  {image.width && image.height && (
                    <span>{image.width} × {image.height} px</span>
                  )}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
