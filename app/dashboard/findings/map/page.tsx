"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import FindingsFilters from "../_components/FindingFilters";

const FindingsMap = dynamic(() => import("../_components/FindingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
  ),
});

export default function FindingsPage() {
  const [filters, setFilters] = useState({ search: "", sort: "newest" });

  return (
    <div className="h-full">
      <FindingsFilters onChange={setFilters} />
      <FindingsMap filters={filters} />
    </div>
  );
}
