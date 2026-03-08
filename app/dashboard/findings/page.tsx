"use client";

import { Suspense } from "react";
import FindingDashboard from "./_components/FindingDashboard";
import FindingsClient from "./_components/FindingsClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function FindingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-[2/1] rounded-xl" />
            <Skeleton className="aspect-[2/1] rounded-xl" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <FindingsPageContent />
    </Suspense>
  );
}

function FindingsPageContent() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">Funde</h1>
      <FindingDashboard />
      <FindingsClient />
    </div>
  );
}
