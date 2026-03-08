"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Funde</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalFindings ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funde diesen Monat</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-2xl font-bold">{stats?.findingsThisMonth ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beliebtester Tag</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            ) : stats?.mostUsedTag ? (
              <div>
                <div className="text-2xl font-bold">{stats.mostUsedTag.name}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.mostUsedTag.count} Funde
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Keine Tags</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unbestimmt</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-2xl font-bold">{stats?.unidentifiedCount ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden border">
        <FindingsMap filters={{ search: "", sort: "newest" }} />
      </div>
    </div>
  );
}
