"use client";

import dynamic from "next/dynamic";
import { CldImage } from "next-cloudinary";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import TagComponent from "@/components/tags/Tag";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, ChevronLeft, MessageSquare, Pencil, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
  ),
});

type Comment = FindingWithRelations["comments"][number];

interface Props {
  finding: FindingWithRelations;
}

export default function FindingDetail({ finding }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(finding.comments ?? []);
  const [sortLatestFirst, setSortLatestFirst] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!finding) return null;

  const images = finding.images ?? [];
  const hasDetails =
    finding.depth || finding.weight || finding.diameter ||
    finding.dating || finding.dating_from || finding.dating_to ||
    finding.references || finding.description_front || finding.description_back;

  const sortedComments = sortLatestFirst ? [...comments] : [...comments].reverse();

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
      setComments((prev) => sortLatestFirst ? [newComment, ...prev] : [...prev, newComment]);
      setCommentText("");
      toast.success("Kommentar hinzugefügt.");
    } catch {
      toast.error("Fehler beim Senden.");
    } finally {
      setSubmitting(false);
    }
  };

  const commentForm = session ? (
    <div className="flex gap-3 p-4 border-2 border-black/[0.05] rounded-lg bg-muted">
      <Avatar className="h-8 w-8 rounded-full shrink-0">
        <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? "Ich"} />
        <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-xs font-bold">
          {(session.user?.name ?? "I").charAt(0).toUpperCase()}
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
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCommentSubmit();
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
        <div className="flex items-center justify-between gap-3 -ml-1">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 -mt-0.5 text-muted-foreground hover:text-foreground shrink-0 rounded-lg flex items-center justify-center p-0"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={3} />
            </Button>
            <h1 className="text-4xl font-bold leading-none truncate">{finding.name}</h1>
          </div>
          <Button
            variant="ghost"
            className="shrink-0 h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
            onClick={() => router.push(`/dashboard/findings/${finding.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
            Fund Bearbeiten
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ml-0">
          <span>{format(new Date(finding.foundAt ?? finding.createdAt), "d. MMMM yyyy", { locale: de })}</span>
          {finding.user?.name && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Avatar className="h-6 w-6 rounded-full shrink-0">
                  <AvatarImage src={finding.user.image ?? undefined} alt={finding.user.name} />
                  <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[9px] font-bold">
                    {finding.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link href={`/dashboard/profile/${finding.user.id}`} className="hover:underline">
                  {finding.user.name}
                </Link>
              </span>
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
        <Card className="bg-muted p-6 space-y-4 border-black/[0.05] rounded-lg">
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

      {/* Comments */}
      <div id="comments" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            Kommentare {comments.length > 0 && `(${comments.length})`}
          </h2>
          {comments.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground gap-1.5"
              onClick={() => setSortLatestFirst((v) => !v)}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortLatestFirst ? "Neueste zuerst" : "Älteste zuerst"}
            </Button>
          )}
        </div>

        {sortLatestFirst && commentForm}

        {sortedComments.length > 0 && (
          <div className="space-y-3">
            {sortedComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 border-2 border-black/[0.05] rounded-lg bg-muted">
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                  <AvatarImage src={comment.user?.image ?? undefined} alt={comment.user?.name ?? "Anonym"} />
                  <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-xs font-bold">
                    {(comment.user?.name ?? "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.user ? (
                      <Link href={`/dashboard/profile/${comment.user.id}`} className="text-sm font-bold hover:underline">
                        {comment.user.name ?? "Anonym"}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold">Anonym</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(comment.createdAt), "d. MMM yyyy", { locale: de })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!sortLatestFirst && commentForm}
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
              {(image.title || image.description || image.originalFilename || image.fileSize || image.width) && (
                <div className="px-1 pt-2 pb-1 space-y-1">
                  {image.title && <p className="text-sm font-semibold text-foreground">{image.title}</p>}
                  {image.description && <p className="text-sm text-muted-foreground">{image.description}</p>}
                  {(image.originalFilename || image.fileSize || image.width) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
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
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
