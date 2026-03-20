"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FindingWithRelations } from "@/types/FindingWithRelations";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, MessageSquare, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import FindingLocationDialog from "./FindingLocationDialog";
import TagComponent from "@/components/tags/Tag";
import VoteButton from "./VoteButton";

interface FindingCardProps {
  finding: FindingWithRelations;
  hideTags?: boolean;
  // Vote data — supplied by community feed; absent on private findings list
  votesCount?: number;
  userVoted?: boolean;
}

export default function FindingCard({
  finding,
  hideTags = false,
  votesCount: initialVotesCount,
  userVoted: initialUserVoted = false,
}: FindingCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = !!session?.user?.id && session.user.id === finding.userId;
  const [showMap, setShowMap] = useState(false);
  const [county, setCounty] = useState<string | null>(null);

  // Vote data — only present when supplied by the community feed
  const hasVoting = initialVotesCount !== undefined;

  const formattedDate = format(new Date(finding.createdAt), "d.M.yy", {
    locale: de,
  });
  const displayImage =
    finding.images?.find((img) => img.id === finding.thumbnailId) ||
    finding.images?.[0];
  const hasLocation = finding.latitude != null && finding.longitude != null;

  const handleCardClick = () => {
    router.push(`/findings/${finding.id}`);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex gap-5 border-2 border-black/[0.05] rounded-lg bg-white p-4 items-start hover:border-[#333333] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
      >
        {/* Left: content */}
        <div className="flex-1 min-w-0 flex flex-col min-h-[128px] justify-start">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[19px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 -mt-0.5">
              {finding.name}
            </h3>

            <div className="flex items-center gap-3 flex-wrap -mt-2">
              <span className="text-[12px] text-muted-foreground/70 font-normal">
                {formattedDate}
              </span>
              {county && (
                <span className="text-[12px] text-muted-foreground/70 font-normal">
                  {county}
                </span>
              )}
              <span
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (finding.user?.id)
                    router.push(`/profile/${finding.user.id}`);
                }}
              >
                <Avatar className="h-5 w-5 rounded-full shrink-0">
                  <AvatarImage
                    src={finding.user?.image ?? undefined}
                    alt={finding.user?.name ?? "Anonym"}
                  />
                  <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[8px] font-bold">
                    {getInitials(finding.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12px] text-muted-foreground/80 underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-muted-foreground/70 font-normal transition-colors">
                  {finding.user?.name ?? "Anonym"}
                </span>
              </span>
              {finding.status === "COMPLETED" ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-green-600">
                  Aktiv
                </span>
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                  Entwurf
                </span>
              )}
              {finding.reported && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-green-600">
                  Gemeldet
                </span>
              )}
            </div>
          </div>

          {finding.description && (
            <p className="mt-3 text-[14.5px] leading-[1.35] line-clamp-2 text-foreground/80 font-light tracking-tight pr-4">
              {finding.description}
            </p>
          )}

          {/* Tags at bottom */}
          {!hideTags && finding.tags && finding.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-3">
              {finding.tags.map((tag) => (
                <TagComponent
                  key={tag.id}
                  tag={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/findings?tags=${tag.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: image thumbnail */}
        {displayImage && (
          <div className="w-[200px] self-stretch shrink-0 bg-[#F8F8F8] rounded-lg overflow-hidden border border-black/[0.05] relative flex items-center justify-center">
            <CldImage
              src={displayImage.publicId}
              width={460}
              height={256}
              crop="fill"
              gravity="auto"
              alt={finding.name || "Fundbild"}
              format="auto"
              quality="auto"
              className="w-full h-full object-cover"
            />
            {(displayImage.title || displayImage.description) && (
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {displayImage.title && (
                  <p className="text-[11px] font-semibold leading-tight truncate">
                    {displayImage.title}
                  </p>
                )}
                {displayImage.description && (
                  <p className="text-[10px] text-white/75 leading-tight truncate mt-0.5">
                    {displayImage.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Far right: action buttons */}
        <div className="flex flex-col gap-2 shrink-0 justify-start">
          {/* Vote button — shown on community feed */}
          {hasVoting && (
            <VoteButton
              targetType="FINDING"
              targetId={finding.id}
              initialVotesCount={initialVotesCount ?? 0}
              initialUserVoted={initialUserVoted ?? false}
              isOwner={isOwner}
              variant="card"
            />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/findings/${finding.id}`);
            }}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95] relative"
            title="Kommentare"
          >
            {(() => {
              const count =
                (finding as any).commentsCount ?? finding.comments?.length ?? 0;
              return count > 0 ? (
                <>
                  <MessageSquare
                    className="h-[19px] w-[19px]"
                    strokeWidth={0}
                    fill="currentColor"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white leading-none mt-0.5">
                    {count}
                  </span>
                </>
              ) : (
                <MessageSquare
                  className="h-[19px] w-[19px]"
                  strokeWidth={1.2}
                />
              );
            })()}
          </button>
          {isOwner && (
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
          )}
          {hasLocation && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMap(true);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95]"
              title="Fundort"
            >
              <MapPin className="h-[19px] w-[19px]" strokeWidth={1.2} />
            </button>
          )}
        </div>
      </div>

      {hasLocation && (
        <FindingLocationDialog
          open={showMap}
          onClose={() => setShowMap(false)}
          latitude={finding.latitude}
          longitude={finding.longitude}
          county={county}
          name={finding.name}
        />
      )}
    </>
  );
}
