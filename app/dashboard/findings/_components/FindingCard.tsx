"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { MessageSquare, Pencil } from "lucide-react";
import Link from "next/link";

interface FindingCardProps {
  finding: FindingWithRelations;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const router = useRouter();

  const formattedDate = format(new Date(finding.createdAt), "d.M.yyyy", { locale: de });
  const firstImage = finding.images?.[0];

  return (
    <div className="flex gap-0 border rounded-xl bg-white overflow-hidden">
      {/* Left: content */}
      <div className="flex-1 p-5 min-w-0">
        <Link
          href={`findings/${finding.id}`}
          className="text-xl font-bold underline underline-offset-2 hover:text-primary leading-tight"
        >
          {finding.name}
        </Link>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground underline underline-offset-2">
            {finding.user?.name ?? "Anonym"}
          </span>
          {finding.tags?.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {finding.status === "DRAFT" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase bg-amber-100 text-amber-800">
              Entwurf
            </span>
          )}
        </div>

        {finding.description && (
          <p className="mt-3 text-sm leading-relaxed line-clamp-3 text-foreground">
            {finding.description}
          </p>
        )}
      </div>

      {/* Right: image */}
      {firstImage ? (
        <div className="w-44 shrink-0 self-stretch relative">
          <CldImage
            src={firstImage.publicId}
            width={320}
            height={240}
            crop="fill"
            gravity="auto"
            alt={finding.name}
            format="auto"
            quality="auto"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-44 shrink-0 self-stretch bg-muted/60" />
      )}

      {/* Far right: action buttons */}
      <div className="flex flex-col gap-2 p-2 shrink-0 justify-start">
        <button
          type="button"
          onClick={() => router.push(`findings/${finding.id}`)}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-input bg-white text-muted-foreground shadow-sm hover:bg-accent"
          title="Kommentare"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push(`findings/${finding.id}/edit`)}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-input bg-white text-muted-foreground shadow-sm hover:bg-accent"
          title="Bearbeiten"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
