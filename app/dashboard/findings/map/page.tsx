"use client";

import { useState } from "react";
import FindingsFilters from "../_components/FindingFilters";
import FindingsMap from "../_components/FindingMap";

export default function FindingsPage() {
  const [filters, setFilters] = useState({ search: "", sort: "newest" });

  return (
    <div className="h-full">
      <FindingsFilters onChange={setFilters} />
      <FindingsMap filters={filters} />
    </div>
  );
}
