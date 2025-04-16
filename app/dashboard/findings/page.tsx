"use client";

import { useState } from "react";
import FindingsFilters from "./_components/FindingFilters";
import FindingsList from "./_components/FindingList";

export default function FindingsPage() {
  const [filters, setFilters] = useState({ search: "", sort: "newest" });

  return (
    <div className="space-y-6">
      <FindingsFilters onChange={setFilters} />
      <FindingsList filters={filters} />
    </div>
  );
}
