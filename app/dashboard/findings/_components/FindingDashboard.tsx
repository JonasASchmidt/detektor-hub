"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Tag, FileEdit } from "lucide-react";

const FindingsMap = dynamic(() => import("./FindingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
  ),
});

interface Stats {
  totalFindings: number;
  findingsThisMonth: number;
  mostUsedTag: { name: string; id: string; count: number } | null;
  draftCount: number;
}

export default function FindingDashboard({ filteredTotal }: { filteredTotal?: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/findings/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const kpis = [
    {
      label: "Gesamte Funde",
      value: filteredTotal ?? stats?.totalFindings ?? 0,
      icon: MapPin,
      href: "/dashboard/findings",
    },
    {
      label: "Funde diesen Monat",
      value: stats?.findingsThisMonth ?? 0,
      icon: Calendar,
      href: `/dashboard/findings?dateFrom=${monthStart}`,
    },
    {
      label: "Häufigster Tag",
      value: stats?.mostUsedTag ? `${stats.mostUsedTag.name} (${stats.mostUsedTag.count})` : "–",
      icon: Tag,
      href: stats?.mostUsedTag ? `/dashboard/findings?tags=${stats.mostUsedTag.id}` : undefined,
    },
    {
      label: "Offene Entwürfe",
      value: stats?.draftCount ?? 0,
      icon: FileEdit,
      href: "/dashboard/findings?status=DRAFT",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[120px]">
      <Card className="min-h-[120px]">
        <CardContent className="h-full flex flex-col justify-center px-[20px] py-[16px] gap-1.5">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <kpi.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {kpi.label}
                </span>
              </div>
              {loading ? (
                <div className="h-5 w-10 animate-pulse bg-muted rounded shrink-0" />
              ) : kpi.href ? (
                <button
                  onClick={() => router.push(kpi.href!)}
                  className="text-lg font-bold whitespace-nowrap hover:underline underline-offset-2 shrink-0"
                >
                  {kpi.value}
                </button>
              ) : (
                <span className="text-lg font-bold whitespace-nowrap shrink-0">
                  {kpi.value}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="hidden md:block overflow-hidden min-h-[120px]">
        <FindingsMap filters={{ search: "", sort: "newest" }} />
      </Card>
    </div>
  );
}
