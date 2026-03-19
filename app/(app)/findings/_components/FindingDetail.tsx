"use client";

import dynamic from "next/dynamic";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FindingWithRelations } from "@/types/FindingWithRelations";
import TagComponent from "@/components/tags/Tag";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronDown,
  MessageSquare,
  Maximize2,
  Pencil,
  Send,
  Flag,
  Globe,
  X,
  MapPin,
} from "lucide-react";
import VoteButton from "./VoteButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectFilter } from "@/components/filters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getInitials } from "@/lib/initials";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
  ),
});

const AdminUnitMap = dynamic(() => import("@/components/map/AdminUnitMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
  ),
});

type Comment = FindingWithRelations["comments"][number];

interface Props {
  finding: FindingWithRelations;
  votesCount?: number;
  userVoted?: boolean;
  commentVoteCountMap?: Record<string, number>;
  commentUserVotedSet?: Set<string>;
}

export default function FindingDetail({
  finding,
  votesCount = 0,
  userVoted = false,
  commentVoteCountMap = {},
  commentUserVotedSet = new Set(),
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(finding.comments ?? []);
  const [commentSort, setCommentSort] = useState<"newest" | "oldest">("newest");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [adminPolygon, setAdminPolygon] = useState<import("geojson").GeoJsonObject | null>(null);
  const [status, setStatus] = useState(finding.status);
  const [reported, setReported] = useState(finding.reported);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const isOwner = session?.user?.id === finding.userId;
  const showLocation = isOwner || finding.locationPublic;

  // Fetch the admin unit polygon when the location is private
  useEffect(() => {
    if (showLocation) return;
    if (
      !finding.adminMunicipality &&
      !finding.adminCounty &&
      !finding.adminFederalState
    )
      return;
    const params = new URLSearchParams();
    if (finding.adminMunicipality)
      params.set("municipality", finding.adminMunicipality);
    if (finding.adminCounty) params.set("county", finding.adminCounty);
    if (finding.adminFederalState)
      params.set("federalState", finding.adminFederalState);
    fetch(`/api/geo/admin-units/polygon?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) setAdminPolygon(data);
      })
      .catch(() => {});
  }, [
    showLocation,
    finding.adminMunicipality,
    finding.adminCounty,
    finding.adminFederalState,
  ]);

  if (!finding) return null;

  const images = finding.images ?? [];
  const hasDetails =
    finding.depth ||
    finding.weight ||
    finding.diameter ||
    finding.dating ||
    finding.dating_from ||
    finding.dating_to ||
    finding.references ||
    finding.description_front ||
    finding.description_back;

  const sortedComments =
    commentSort === "newest" ? [...comments] : [...comments].reverse();

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/findings/${finding.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setComments((prev) =>
        commentSort === "newest"
          ? [newComment, ...prev]
          : [...prev, newComment],
      );
      setCommentText("");
      toast.success("Kommentar hinzugefügt.");
    } catch {
      toast.error("Fehler beim Senden.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (field: "status" | "reported") => {
    if (statusUpdating) return;
    setStatusUpdating(true);
    const patch =
      field === "status"
        ? { status: status === "COMPLETED" ? "DRAFT" : "COMPLETED" }
        : { reported: !reported };
    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      if (field === "status") setStatus(patch.status as "DRAFT" | "COMPLETED");
      else setReported(patch.reported as boolean);
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const commentForm = session ? (
    <div className="flex gap-3 p-4 border-2 border-black/[0.05] rounded-lg bg-muted">
      <Avatar className="h-8 w-8 rounded-full shrink-0">
        <AvatarImage
          src={session.user?.image ?? undefined}
          alt={session.user?.name ?? "Ich"}
        />
        <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-xs font-bold">
          {getInitials(session.user?.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          placeholder="Kommentar hinzufügen…"
          rows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
              handleCommentSubmit();
          }}
        />
        <Button
          size="sm"
          className="font-bold"
          disabled={submitting || !commentText.trim()}
          onClick={handleCommentSubmit}
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {submitting ? "Sendet…" : "Kommentieren"}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="max-w-[720px] mx-auto w-full px-6 pb-10 pt-12 md:px-10 md:pt-16 space-y-6">
      {/* Title & meta */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold leading-[1.3]">{finding.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-8 w-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] p-0 transition-all duration-150 ease-in-out"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={2.5} />
          </Button>
          {/* Vote button — visible for all users on completed findings */}
          {finding.status === "COMPLETED" && (
            <VoteButton
              targetType="FINDING"
              targetId={finding.id}
              initialVotesCount={votesCount}
              initialUserVoted={userVoted}
              isOwner={isOwner}
              variant="detail"
            />
          )}
          {isOwner && status === "DRAFT" && (
            <Button
              variant="ghost"
              className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
              disabled={statusUpdating}
              onClick={() => handleStatusToggle("status")}
            >
              <Globe className="h-4 w-4" />
              Fund Veröffentlichen
            </Button>
          )}
          {isOwner && !reported && (
            <Button
              variant="ghost"
              className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
              disabled={statusUpdating}
              onClick={() => handleStatusToggle("reported")}
            >
              <Flag className="h-4 w-4" />
              Fund Melden
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
              onClick={() => router.push(`/findings/${finding.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              Fund Bearbeiten
            </Button>
          )}
        </div>
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ml-0">
            <span>
              {format(
                new Date(finding.foundAt ?? finding.createdAt),
                "d. MMMM yy",
                { locale: de },
              )}
            </span>
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
                <Link
                  href={`/profile/${finding.user.id}`}
                  className="hover:underline"
                >
                  {finding.user.name}
                </Link>
              </span>
            )}
            {isOwner ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStatusToggle("status")}
                    disabled={statusUpdating}
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-70 disabled:opacity-40 ${status === "COMPLETED" ? "text-green-600" : "text-muted-foreground/60"}`}
                  >
                    {status === "COMPLETED" ? "Aktiv" : "Entwurf"}
                    <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {status === "COMPLETED"
                    ? "Klicken um als Entwurf zu markieren"
                    : "Klicken um zu veröffentlichen"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${status === "COMPLETED" ? "text-green-600" : "text-muted-foreground/60"}`}
              >
                {status === "COMPLETED" ? "Aktiv" : "Entwurf"}
              </span>
            )}
            {isOwner ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStatusToggle("reported")}
                    disabled={statusUpdating}
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide transition-opacity hover:opacity-70 disabled:opacity-40 ${reported ? "text-green-600" : "text-muted-foreground/60"}`}
                  >
                    {reported ? "Gemeldet" : "Nicht gemeldet"}
                    <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {reported
                    ? "Klicken um Meldung zurückzuziehen"
                    : "Klicken um als gemeldet zu markieren"}
                </TooltipContent>
              </Tooltip>
            ) : reported ? (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-green-600">
                Gemeldet
              </span>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                Nicht gemeldet
              </span>
            )}
          </div>
        </TooltipProvider>
        {finding.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {finding.tags.map((tag) => (
              <TagComponent
                key={tag.id}
                tag={tag}
                onClick={() => router.push(`/findings?tags=${tag.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {finding.description && (
        <p className="text-base leading-relaxed text-foreground/90">
          {finding.description}
        </p>
      )}

      {/* Details */}
      {hasDetails && (
        <Card className="bg-muted p-6 space-y-4 border-black/[0.05] rounded-lg">
          <h2 className="text-xl font-bold">Details</h2>

          {(finding.depth || finding.weight || finding.diameter) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {finding.depth && (
                <span>
                  <span className="text-muted-foreground">Tiefe</span>{" "}
                  {finding.depth} cm
                </span>
              )}
              {finding.weight && (
                <span>
                  <span className="text-muted-foreground">Gewicht</span>{" "}
                  {finding.weight} g
                </span>
              )}
              {finding.diameter && (
                <span>
                  <span className="text-muted-foreground">Durchmesser</span>{" "}
                  {finding.diameter} cm
                </span>
              )}
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

      {/* Admin unit polygon — only when exact location is private */}
      {!showLocation && adminPolygon && (
        <div className="relative rounded-lg overflow-hidden h-48">
          <AdminUnitMap geojson={adminPolygon} />
        </div>
      )}

      {/* Exact location map — only when location is public */}
      {showLocation &&
        finding.latitude != null &&
        finding.longitude != null && (
          <>
            <div
              className="relative rounded-lg overflow-hidden h-48 cursor-pointer group"
              onClick={() => setMapExpanded(true)}
            >
              <FindingDetailMap
                latitude={finding.latitude}
                longitude={finding.longitude}
              />
              <div className="absolute inset-0 pointer-events-none" />
              <button
                className="absolute top-2 right-2 z-[1000] bg-white/90 hover:bg-white rounded-md p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setMapExpanded(true);
                }}
                aria-label="Karte vergrößern"
              >
                <Maximize2 className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {mapExpanded && (
              <div
                className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
                onClick={() => setMapExpanded(false)}
              >
                <div
                  className="relative w-full h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FindingDetailMap
                    latitude={finding.latitude}
                    longitude={finding.longitude}
                  />
                  <button
                    className="absolute top-4 right-4 z-[10000] bg-white rounded-md p-2 shadow-lg"
                    onClick={() => setMapExpanded(false)}
                    aria-label="Schließen"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      {/* Admin unit label — always shown when available */}
      {(finding.adminMunicipality || finding.adminCounty || finding.adminFederalState) && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {[finding.adminMunicipality, finding.adminCounty, finding.adminFederalState]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}

      {/* Images */}
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
              {(image.title ||
                image.description ||
                image.originalFilename ||
                image.fileSize ||
                image.width) && (
                <div className="px-1 pt-2 pb-1 space-y-1">
                  {image.title && (
                    <p className="text-[15px] font-semibold text-foreground">
                      {image.title}
                    </p>
                  )}
                  {image.description && (
                    <p className="text-[15px] text-muted-foreground">
                      {image.description}
                    </p>
                  )}
                  {(image.originalFilename ||
                    image.fileSize ||
                    image.width) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {image.originalFilename && (
                        <span>{image.originalFilename}</span>
                      )}
                      {image.fileSize && (
                        <span>
                          {image.fileSize < 1024 * 1024
                            ? `${(image.fileSize / 1024).toFixed(1)} KB`
                            : `${(image.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                      )}
                      {image.width && image.height && (
                        <span>
                          {image.width} × {image.height} px
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Comments */}
      <div id="comments" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            Kommentare {comments.length > 0 && `(${comments.length})`}
          </h2>
          {comments.length > 1 && (
            <SelectFilter
              value={commentSort}
              onChange={(v) => setCommentSort(v as "newest" | "oldest")}
              options={[
                { value: "newest", label: "Neueste zuerst" },
                { value: "oldest", label: "Älteste zuerst" },
              ]}
              className="w-[160px]"
            />
          )}
        </div>

        {commentForm}

        {sortedComments.length > 0 && (
          <div className="space-y-3">
            {sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-4 border-2 border-black/[0.05] rounded-lg bg-muted"
              >
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                  <AvatarImage
                    src={comment.user?.image ?? undefined}
                    alt={comment.user?.name ?? "Anonym"}
                  />
                  <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-xs font-bold">
                    {getInitials(comment.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.user ? (
                      <Link
                        href={`/profile/${comment.user.id}`}
                        className="text-sm font-bold hover:underline"
                      >
                        {comment.user.name ?? "Anonym"}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold">Anonym</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(comment.createdAt), "d. MMM yyyy", {
                        locale: de,
                      })}
                    </span>
                    <span className="ml-auto">
                      <VoteButton
                        targetType="COMMENT"
                        targetId={comment.id}
                        initialVotesCount={commentVoteCountMap[comment.id] ?? 0}
                        initialUserVoted={commentUserVotedSet.has(comment.id)}
                        isOwner={comment.userId === session?.user?.id}
                        variant="comment"
                      />
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
