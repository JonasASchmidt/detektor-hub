"use client";

import { useEffect, useState, Suspense } from "react";
import { format } from "date-fns";
import { CldImage } from "next-cloudinary";
import Tag from "@/components/tags/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tag as TagType, Image as ImageType } from "@prisma/client";
import CommunityFilters from "./_components/CommunityFilters";
import { useFiltersFromURL } from "../findings/_components/FindingFilters";
import { useFindings } from "@/app/_hooks/useFindings";
import FindingCard from "../findings/_components/FindingCard";
import { MessageSquare } from "lucide-react";

interface CommunityActivity {
  type: "finding" | "comment";
  id: string;
  createdAt: string;
  userName?: string;
  userImage?: string;
  // Finding fields
  name?: string;
  description?: string;
  foundAt?: string;
  dating?: string;
  images?: ImageType[];
  tags?: TagType[];
  // Comment fields
  text?: string;
  findingId?: string;
  findingName?: string;
}

function CommentActivityCard({ activity }: { activity: CommunityActivity }) {
  const formattedDate = format(new Date(activity.createdAt), "dd.MM.yyyy HH:mm");

  return (
    <div className="flex gap-4 p-4 border rounded-md bg-white dark:bg-zinc-900 shadow-sm border-black/[0.05]">
      <div className="w-10 h-10 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-black/[0.05]">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold truncate">
            {activity.userName || "Anonym"}
          </span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            Kommentierte
          </span>
          <span className="text-sm font-bold hover:underline cursor-pointer truncate">
            {activity.findingName}
          </span>
        </div>

        <p className="text-sm text-foreground/80 line-clamp-3 mb-2">
          "{activity.text}"
        </p>

        <div className="flex items-center gap-2">
           <span className="text-[10px] text-muted-foreground">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-md" />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-20 w-full rounded-md" />
          <div className="space-y-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-md" />
            ))}
          </div>
        </div>
      }
    >
      <CommunityPageContent />
    </Suspense>
  );
}

function CommunityPageContent() {
  const filters = useFiltersFromURL();
  const { findings, loading } = useFindings(filters, "/api/community/findings");

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Öffentlich</h1>
      <CommunityFilters />
      
      <section className="pt-4">
        <h2 className="text-2xl font-bold mb-4">Alle Beiträge</h2>
        {loading ? (
          <SectionSkeleton />
        ) : findings.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Keine Aktivitäten gefunden.
          </p>
        ) : (
          <div className="space-y-3">
            {findings.map((item: any) => {
              if (item.type === "finding") {
                return <FindingCard key={item.id} finding={item} />;
              } else {
                return <CommentActivityCard key={item.id} activity={item} />;
              }
            })}
          </div>
        )}
      </section>
    </div>
  );
}
