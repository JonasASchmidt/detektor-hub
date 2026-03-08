"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import FindingsFilters, {
  useFiltersFromURL,
} from "../_components/FindingFilters";

const FindingsMap = dynamic(() => import("../_components/FindingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
  ),
});

function MapPageContent() {
  const filters = useFiltersFromURL();

  return (
    <div className="h-full">
      <FindingsFilters />
      <FindingsMap filters={{ search: filters.search || "", sort: "newest" }} />
    </div>
  );
}

export default function FindingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Laden...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
