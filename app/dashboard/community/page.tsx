"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import CommunityFilters from "./_components/CommunityFilters";
import { useFiltersFromURL } from "../findings/_components/FindingFilters";
import { useFindings } from "@/app/_hooks/useFindings";
import FindingCard from "../findings/_components/FindingCard";
import { SelectFilter } from "@/components/filters";
import { useURLFilters } from "@/app/_hooks/useURLFilters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface LatestComment {
  id: string;
  text: string;
  createdAt: string;
  userName: string | null;
  userImage: string | null;
}

interface CommunityFinding {
  id: string;
  latestComment?: LatestComment | null;
  [key: string]: unknown;
}

function CommentStrip({ findingId, comment }: { findingId: string; comment: LatestComment }) {
  const router = useRouter();
  const formattedDate = format(new Date(comment.createdAt), "d. MMM yyyy", { locale: de });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/findings/${findingId}#comments`);
      }}
      className="flex items-start gap-3 px-4 py-3 ml-4 bg-muted border-2 border-t-0 border-black/[0.05] rounded-b-lg cursor-pointer hover:brightness-95 transition-all"
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" strokeWidth={1.5} />
      <Avatar className="h-5 w-5 rounded-full shrink-0">
        <AvatarImage src={comment.userImage ?? undefined} alt={comment.userName ?? "Anonym"} />
        <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[8px] font-bold">
          {getInitials(comment.userName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="text-[12px] font-semibold text-foreground/80 shrink-0">{comment.userName ?? "Anonym"}</span>
        <p className="text-[12px] text-muted-foreground truncate">„{comment.text}"</p>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">{formattedDate}</span>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
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
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="space-y-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
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
  const { searchParams, setFilter } = useURLFilters();

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Öffentlich</h1>
      <CommunityFilters />

      <section className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Alle Beiträge</h2>
          <SelectFilter
            value={searchParams.get("sort") || "newest"}
            onChange={(v) => setFilter("sort", v)}
            options={[
              { value: "newest", label: "Neueste zuerst" },
              { value: "oldest", label: "Älteste zuerst" },
              { value: "az", label: "Alphabetisch" },
            ]}
            placeholder="Sortieren"
            className="w-[160px]"
          />
        </div>
        {loading ? (
          <SectionSkeleton />
        ) : findings.length === 0 ? (
          <p className="text-muted-foreground text-sm">Keine Beiträge gefunden.</p>
        ) : (
          <div className="space-y-3">
            {findings.map((item: CommunityFinding) => (
              <div key={item.id} className="flex flex-col">
                <FindingCard finding={item as any} hideTags />
                {item.latestComment && (
                  <CommentStrip findingId={item.id} comment={item.latestComment} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
