"use client";

import { Suspense, useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import CommunityFilters from "./_components/CommunityFilters";
import { useFiltersFromURL } from "../findings/_components/FindingFilters";
import { useFindings } from "@/hooks/useFindings";
import FindingCard from "../findings/_components/FindingCard";
import { SelectFilter } from "@/components/filters";
import { useURLFilters } from "@/hooks/useURLFilters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import { MessageSquare, Trophy } from "lucide-react";
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
  userId?: string;
  latestComment?: LatestComment | null;
  votesCount?: number;
  userVoted?: boolean;
  [key: string]: unknown;
}

interface TopFindingData {
  finding: CommunityFinding | null;
  period: string;
  isFallback: boolean;
}

function CommentStrip({
  findingId,
  comment,
}: {
  findingId: string;
  comment: LatestComment;
}) {
  const router = useRouter();
  const formattedDate = format(new Date(comment.createdAt), "d. MMM yyyy", {
    locale: de,
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/findings/${findingId}#comments`);
      }}
      className="flex items-start gap-3 px-4 py-3 ml-4 bg-muted border-2 border-t-0 border-black/[0.05] rounded-b-lg cursor-pointer hover:brightness-95 transition-all"
    >
      <MessageSquare
        className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5"
        strokeWidth={1.5}
      />
      <Avatar className="h-5 w-5 rounded-full shrink-0">
        <AvatarImage
          src={comment.userImage ?? undefined}
          alt={comment.userName ?? "Anonym"}
        />
        <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[8px] font-bold">
          {getInitials(comment.userName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="text-[12px] font-semibold text-foreground/80 shrink-0">
          {comment.userName ?? "Anonym"}
        </span>
        <p className="text-[12px] text-muted-foreground truncate">
          „{comment.text}"
        </p>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}

function TopFindingCard({
  label,
  icon,
  data,
  loading,
}: {
  label: string;
  icon: React.ReactNode;
  data: TopFindingData | null;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[160px] w-full rounded-lg" />;
  }
  if (!data?.finding) return null;

  const { finding, isFallback } = data;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        <span>{label}</span>
        {isFallback && (
          <span className="text-[11px] font-normal text-muted-foreground/60">
            (alle Zeit)
          </span>
        )}
      </div>
      <FindingCard
        finding={finding as any}
        hideTags
        votesCount={finding.votesCount}
        userVoted={finding.userVoted}
      />
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

  // Fetch top findings (week + year)
  const [topWeek, setTopWeek] = useState<TopFindingData | null>(null);
  const [topYear, setTopYear] = useState<TopFindingData | null>(null);
  const [topLoading, setTopLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/community/top-finding?period=week").then((r) => r.json()),
      fetch("/api/community/top-finding?period=year").then((r) => r.json()),
    ])
      .then(([week, year]) => {
        setTopWeek(week);
        setTopYear(year);
      })
      .catch(() => {})
      .finally(() => setTopLoading(false));
  }, []);

  // Only show top section if at least one has a finding
  const showTopSection = topLoading || topWeek?.finding || topYear?.finding;

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Öffentlich</h1>
      <CommunityFilters />

      {/* Featured: Fund der Woche & des Jahres */}
      {showTopSection && (
        <section className="pt-4 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TopFindingCard
              label="Fund der Woche"
              icon={<Trophy className="h-4 w-4 text-amber-500" />}
              data={topWeek}
              loading={topLoading}
            />
            <TopFindingCard
              label="Fund des Jahres"
              icon={<Trophy className="h-4 w-4 text-amber-600" />}
              data={topYear}
              loading={topLoading}
            />
          </div>
          <hr className="border-black/[0.06]" />
        </section>
      )}

      <section className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Alle Beiträge</h2>
          <SelectFilter
            value={searchParams.get("sort") || "newest"}
            onChange={(v) => setFilter("sort", v)}
            options={[
              { value: "newest", label: "Neueste zuerst" },
              { value: "oldest", label: "Älteste zuerst" },
              { value: "az", label: "Alphabetisch" },
              { value: "votes", label: "Meiste Votes" },
            ]}
            placeholder="Sortieren"
            className="w-[165px]"
          />
        </div>
        {loading ? (
          <SectionSkeleton />
        ) : findings.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Keine Beiträge gefunden.
          </p>
        ) : (
          <div className="space-y-3">
            {findings.map((item: CommunityFinding) => (
              <div key={item.id} className="flex flex-col">
                <FindingCard
                  finding={item as any}
                  hideTags
                  votesCount={item.votesCount}
                  userVoted={item.userVoted}
                />
                {item.latestComment && (
                  <CommentStrip
                    findingId={item.id}
                    comment={item.latestComment}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
