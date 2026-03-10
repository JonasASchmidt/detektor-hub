import { Skeleton } from "@/components/ui/skeleton";

export default function NewFindingLoading() {
  return (
    <div className="max-w-[720px] mx-auto w-full py-10 px-6 space-y-8">
      <Skeleton className="h-10 w-24 mx-auto" />
      <Skeleton className="h-16 w-full" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
