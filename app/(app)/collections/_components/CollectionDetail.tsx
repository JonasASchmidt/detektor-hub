"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import FindingCard from "@/app/(app)/findings/_components/FindingCard";
import { FindingWithRelations } from "@/types/FindingWithRelations";

type CollectionWithFindings = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: { id: string; name: string | null; image: string | null };
  findings: FindingWithRelations[];
  _count: { findings: number };
};

interface Props {
  collection: CollectionWithFindings;
  isOwner: boolean;
}

export default function CollectionDetail({ collection, isOwner }: Props) {
  const router = useRouter();
  const [findings, setFindings] = useState(collection.findings);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteCollection = async () => {
    if (!confirm(`Sammlung „${collection.name}" wirklich löschen?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Sammlung gelöscht.");
      router.push("/collections");
      router.refresh();
    } catch {
      toast.error("Fehler beim Löschen.");
      setDeleting(false);
    }
  };

  const handleRemoveFinding = async (findingId: string) => {
    try {
      const res = await fetch(`/api/collections/${collection.id}/findings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId }),
      });
      if (!res.ok) throw new Error();
      setFindings((prev) => prev.filter((f) => f.id !== findingId));
      toast.success("Fund aus Sammlung entfernt.");
    } catch {
      toast.error("Fehler beim Entfernen.");
    }
  };

  return (
    <div className="px-6 pb-10 pt-12 md:px-10 md:pt-16 max-w-[800px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-8 w-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] p-0 transition-all duration-150 ease-in-out shrink-0"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={2.5} />
          </Button>
          <h1 className="text-4xl font-bold leading-[1.2] flex-1">{collection.name}</h1>
        </div>

        {collection.description && (
          <p className="text-base text-muted-foreground leading-relaxed">
            {collection.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6 rounded-full shrink-0">
              <AvatarImage src={collection.user.image ?? undefined} />
              <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[9px] font-bold">
                {getInitials(collection.user.name)}
              </AvatarFallback>
            </Avatar>
            <Link href={`/profile/${collection.user.id}`} className="hover:underline">
              {collection.user.name}
            </Link>
          </span>
          <span>
            Zuletzt aktualisiert{" "}
            {format(new Date(collection.updatedAt), "d. MMMM yyyy", { locale: de })}
          </span>
          <span className="font-medium text-foreground">
            {findings.length} {findings.length === 1 ? "Fund" : "Funde"}
          </span>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
              onClick={() => router.push(`/collections/${collection.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              Bearbeiten
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 border-2 border-foreground text-foreground hover:bg-red-600 hover:text-white hover:border-red-600 text-[14px] font-bold px-3 transition-all duration-150 ease-in-out"
              disabled={deleting}
              onClick={handleDeleteCollection}
            >
              <Trash2 className="h-4 w-4" />
              Sammlung löschen
            </Button>
          </div>
        )}
      </div>

      {/* Findings list */}
      {findings.length > 0 ? (
        <div className="space-y-3">
          {findings.map((finding) => (
            <div key={finding.id} className="relative group/row">
              <FindingCard finding={finding} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveFinding(finding.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white/80 hover:bg-red-50 text-muted-foreground hover:text-red-600 opacity-0 group-hover/row:opacity-100 transition-all border border-black/[0.06]"
                  title="Aus Sammlung entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground space-y-2">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/30" strokeWidth={1.5} />
          <p>Diese Sammlung enthält noch keine Funde.</p>
          <p className="text-sm">
            Füge Funde über die Detailseite eines Funds hinzu.
          </p>
        </div>
      )}
    </div>
  );
}
