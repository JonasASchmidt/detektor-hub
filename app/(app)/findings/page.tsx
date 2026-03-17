"use client";

import { Suspense } from "react";
import Link from "next/link";
import FindingsClient from "./_components/FindingsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FindingsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
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
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold mb-0">Deine Funde</h1>
        <Button asChild variant="ghost" className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] px-3 transition-all duration-150 ease-in-out">
          <Link href="/findings/new"><Plus className="h-4 w-4" />Neuer Fund</Link>
        </Button>
      </div>
      <FindingsClient />
    </div>
  );
}
