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
  const displayImage = finding.images?.find(img => img.id === finding.thumbnailId) || finding.images?.[0];

  const handleCardClick = () => {
    router.push(`findings/${finding.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative flex gap-5 border-2 border-black/[0.05] rounded-lg bg-white p-4 h-[160px] items-center hover:border-[#333333] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
    >
      {/* Left: content */}
      <div className="flex-1 min-w-0 flex flex-col h-full justify-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[19px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {finding.name}
          </h3>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[12px] text-muted-foreground/70 font-normal">{formattedDate}</span>
            <span className="text-muted-foreground/40 text-[10px]">●</span>
            <span className="text-[12px] text-muted-foreground/80 underline underline-offset-2 decoration-muted-foreground/30 font-normal cursor-default">
              {finding.user?.name ?? "Anonym"}
            </span>
            {finding.tags?.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold tracking-tight uppercase text-white ml-0.5"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {finding.description && (
          <p className="mt-3 text-[14.5px] leading-[1.35] line-clamp-2 text-foreground/80 font-light tracking-tight pr-4">
            {finding.description}
          </p>
        )}
      </div>

      {/* Right: image thumbnail */}
      {displayImage && (
        <div className="w-[230px] h-full shrink-0 bg-[#F8F8F8] rounded-lg overflow-hidden border border-black/[0.05] relative flex items-center justify-center">
          <CldImage
            src={displayImage.publicId}
            width={460}
            height={256}
            crop="fill"
            gravity="auto"
            alt={finding.name || "Fundbild"}
            format="auto"
            quality="auto"
            className="w-full h-full object-cover rounded-lg m-0.5"
          />
        </div>
      )}

      {/* Far right: action buttons */}
      <div className="flex flex-col gap-2 shrink-0 h-full justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`findings/${finding.id}`);
          }}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95]"
          title="Kommentare"
        >
          <MessageSquare className="h-[19px] w-[19px]" strokeWidth={1.2} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`findings/${finding.id}/edit`);
          }}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95]"
          title="Bearbeiten"
        >
          <Pencil className="h-[19px] w-[19px]" strokeWidth={1.2} />
        </button>
      </div>
    </div>


  );
}



