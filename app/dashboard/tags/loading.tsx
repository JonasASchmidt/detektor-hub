import { Skeleton } from "@/components/ui/skeleton";

export default function TagsLoading() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <Skeleton className="h-10 w-24" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
