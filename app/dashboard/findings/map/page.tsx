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
    <div className="h-full p-6 flex flex-col gap-4">
      <h1 className="text-4xl font-bold">Karte</h1>
      <FindingsFilters />
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border">
        <FindingsMap filters={{ search: filters.search || "", sort: "newest" }} />
      </div>
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
