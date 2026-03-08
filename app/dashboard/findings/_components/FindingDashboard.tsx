"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Tag, HelpCircle } from "lucide-react";

const FindingsMap = dynamic(() => import("./FindingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
  ),
});

interface Stats {
  totalFindings: number;
  findingsThisMonth: number;
  mostUsedTag: { name: string; count: number } | null;
  unidentifiedCount: number;
}

export default function FindingDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/findings/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const kpis = [
    {
      label: "Gesamte Funde",
      value: stats?.totalFindings ?? 0,
      icon: MapPin,
    },
    {
      label: "Funde diesen Monat",
      value: stats?.findingsThisMonth ?? 0,
      icon: Calendar,
    },
    {
      label: "Tag mit den meisten Funden",
      value: stats?.mostUsedTag
        ? `${stats.mostUsedTag.name} (${stats.mostUsedTag.count})`
        : "–",
      icon: Tag,
    },
    {
      label: "Unbestimmte Funde",
      value: stats?.unidentifiedCount ?? 0,
      icon: HelpCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left card: all KPIs */}
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

      {/* Right card: map */}
      <Card className="aspect-[2/1] overflow-hidden">
        <FindingsMap filters={{ search: "", sort: "newest" }} />
      </Card>
    </div>
  );
}
