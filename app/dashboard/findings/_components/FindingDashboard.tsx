"use client";

import { useEffect, useState } from "react";
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
  mostUsedTag: { name: string; count: number } | null;
  draftCount: number;
}

export default function FindingDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/findings/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Gesamte Funde", value: stats?.totalFindings ?? 0, icon: MapPin },
    { label: "Funde diesen Monat", value: stats?.findingsThisMonth ?? 0, icon: Calendar },
    {
      label: "Tag mit den meisten Funden",
      value: stats?.mostUsedTag
        ? `${stats.mostUsedTag.name} (${stats.mostUsedTag.count})`
        : "–",
      icon: Tag,
    },
    { label: "Offene Entwürfe", value: stats?.draftCount ?? 0, icon: FileEdit },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="aspect-[2/1]">
        <CardContent className="h-full flex flex-col justify-center gap-4 p-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-3">
              <kpi.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-sm text-muted-foreground truncate">
                  {kpi.label}
                </span>
                {loading ? (
                  <div className="h-5 w-12 animate-pulse bg-muted rounded" />
                ) : (
                  <span className="text-lg font-bold whitespace-nowrap">
                    {kpi.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="aspect-[2/1] overflow-hidden">
        <FindingsMap filters={{ search: "", sort: "newest" }} />
      </Card>
    </div>
  );
}
