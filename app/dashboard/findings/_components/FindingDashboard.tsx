"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Tag, FileEdit, MessageSquare } from "lucide-react";

const FindingsMap = dynamic(() => import("./FindingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
  ),
});

interface Stats {
  totalFindings: number;
  findingsThisMonth: number;
  mostUsedTag: { name: string; id: string; color: string | null; count: number } | null;
  draftCount: number;
  commentsCount: number;
}

export default function FindingDashboard({
  filteredTotal,
  stats,
  loading,
}: {
  filteredTotal?: number;
  stats: Stats | null;
  loading: boolean;
}) {
  const router = useRouter();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const allKpis = [
    {
      label: "Gesamte Funde",
      value: filteredTotal ?? stats?.totalFindings ?? 0,
      active: (filteredTotal ?? stats?.totalFindings ?? 0) > 0,
      icon: MapPin,
      href: "/dashboard/findings",
    },
    {
      label: "Funde diesen Monat",
      value: stats?.findingsThisMonth ?? 0,
      active: (stats?.findingsThisMonth ?? 0) > 0,
      icon: Calendar,
      href: `/dashboard/findings?dateFrom=${monthStart}`,
    },
    {
      label: "Top Tag",
      value: stats?.mostUsedTag ? `${stats.mostUsedTag.name} (${stats.mostUsedTag.count})` : "–",
      active: !!stats?.mostUsedTag,
      icon: Tag,
      href: stats?.mostUsedTag ? `/dashboard/findings?tags=${stats.mostUsedTag.id}` : undefined,
      color: stats?.mostUsedTag?.color ?? undefined,
    },
    {
      label: "Entwürfe",
      value: stats?.draftCount ?? 0,
      active: (stats?.draftCount ?? 0) > 0,
      icon: FileEdit,
      href: "/dashboard/findings?status=DRAFT",
    },
    {
      label: "Kommentare",
      value: stats?.commentsCount ?? 0,
      active: (stats?.commentsCount ?? 0) > 0,
      icon: MessageSquare,
      href: "/dashboard/findings?hasComments=true",
    },
  ];

  const activeKpis = allKpis.filter((k) => k.active);
  const hasActivity = !loading && activeKpis.length > 0;

  if (!loading && !hasActivity) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[160px]">
      {(loading || hasActivity) && (
        <Card className="min-h-[160px]">
          <CardContent className="h-full flex flex-col justify-center px-[20px] py-[16px] gap-2">
            {loading
              ? allKpis.map((kpi) => (
                  <div key={kpi.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <kpi.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground truncate">{kpi.label}</span>
                    </div>
                    <div className="h-5 w-10 animate-pulse bg-muted rounded shrink-0" />
                  </div>
                ))
              : activeKpis.map((kpi) => (
                  <div key={kpi.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <kpi.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground truncate">{kpi.label}</span>
                    </div>
                    {kpi.href ? (
                      <button
                        onClick={() => router.push(kpi.href!)}
                        className="text-lg font-bold whitespace-nowrap hover:underline underline-offset-2 shrink-0"
                        style={kpi.color ? { color: kpi.color } : undefined}
                      >
                        {kpi.value}
                      </button>
                    ) : (
                      <span className="text-lg font-bold whitespace-nowrap shrink-0">{kpi.value}</span>
                    )}
                  </div>
                ))}
          </CardContent>
        </Card>
      )}

      {(loading || hasActivity) && (
        <Card className="hidden md:block overflow-hidden min-h-[120px]">
          <FindingsMap filters={{ search: "", sort: "newest" }} />
        </Card>
      )}
    </div>
  );
}
