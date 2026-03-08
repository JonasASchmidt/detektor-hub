"use client";

import FindingsFilters, { useFiltersFromURL } from "./FindingFilters";
import FindingsList from "./FindingList";

export default function FindingsClient() {
  const filters = useFiltersFromURL();

  return (
    <div className="space-y-4">
      <FindingsFilters />
      <FindingsList filters={filters} />
    </div>
  );
}
