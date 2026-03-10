import { Skeleton } from "@/components/ui/skeleton";

export default function FindingsLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-32" />
      {/* Dashboard stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      {/* Filter bar */}
      <Skeleton className="h-10 w-full" />
      {/* List items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
