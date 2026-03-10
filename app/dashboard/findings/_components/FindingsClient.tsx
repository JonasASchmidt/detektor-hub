"use client";

import { useState } from "react";
import FindingsFilters, { useFiltersFromURL } from "./FindingFilters";
import FindingsList from "./FindingList";
import FindingDashboard from "./FindingDashboard";

export default function FindingsClient() {
  const filters = useFiltersFromURL();
  const [total, setTotal] = useState<number | undefined>(undefined);

  return (
    <div className="space-y-6">
      <FindingDashboard filteredTotal={total} />
      <div className="space-y-4">
        <FindingsFilters />
        <FindingsList filters={filters} onTotalChange={setTotal} />
      </div>
    </div>
  );
}
