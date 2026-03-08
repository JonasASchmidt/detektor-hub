import { Skeleton } from "@/components/ui/skeleton";

export default function FindingDetailLoading() {
  return (
    <div className="max-w-full p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}
