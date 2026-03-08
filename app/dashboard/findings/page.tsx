"use client";

import { Suspense } from "react";
import FindingDashboard from "./_components/FindingDashboard";
import FindingsFilters, { useFiltersFromURL } from "./_components/FindingFilters";
import FindingsList from "./_components/FindingList";

function FindingsPageContent() {
  const filters = useFiltersFromURL();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">Funde</h1>
      <FindingDashboard />
      <div className="space-y-4">
        <FindingsFilters />
        <FindingsList filters={filters} />
      </div>
    </div>
  );
}

export default function FindingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Laden...</div>}>
      <FindingsPageContent />
    </Suspense>
  );
}
