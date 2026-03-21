"use client";

import { useEffect, useState } from "react";
import FindingsFilters, { useFiltersFromURL } from "./FindingFilters";
import FindingsList from "./FindingList";
import FindingDashboard from "./FindingDashboard";

interface Stats {
  totalFindings: number;
  findingsThisMonth: number;
  mostUsedTag: { name: string; id: string; color: string | null; count: number } | null;
  draftCount: number;
  commentsCount: number;
}

export default function FindingsClient() {
  const filters = useFiltersFromURL();
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/findings/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const hasActivity =
    !statsLoading &&
    ((stats?.totalFindings ?? 0) > 0 || (stats?.commentsCount ?? 0) > 0);

  return (
    <div className="space-y-6">
      <FindingDashboard filteredTotal={total} stats={stats} loading={statsLoading} />
      <div className="space-y-4">
        {(statsLoading || hasActivity) && <FindingsFilters />}
        <FindingsList filters={filters} onTotalChange={setTotal} />
      </div>
    </div>
  );
}
