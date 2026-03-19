import { Skeleton } from "@/components/ui/skeleton";

export default function FindingsLoading() {
  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-4 max-w-[720px] mx-auto w-full">
      <Skeleton className="h-10 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[180px] rounded-xl" />
        <Skeleton className="hidden md:block h-[180px] rounded-xl" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-[152px] rounded-lg" />
      <Skeleton className="h-[152px] rounded-lg" />
      <Skeleton className="h-[152px] rounded-lg" />
    </div>
  );
}
