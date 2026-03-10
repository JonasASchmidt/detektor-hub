import { Skeleton } from "@/components/ui/skeleton";

export default function FindingDetailLoading() {
  return (
    <div className="max-w-[720px] mx-auto w-full px-6 pb-10 pt-12 md:px-10 md:pt-16 space-y-4">
      <Skeleton className="w-full aspect-[3/2] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}
