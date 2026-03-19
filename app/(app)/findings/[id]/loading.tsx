import { Skeleton } from "@/components/ui/skeleton";

export default function FindingDetailLoading() {
  return (
    <div className="max-w-[720px] mx-auto w-full px-6 pb-10 pt-12 md:px-10 md:pt-16 space-y-4">
      <Skeleton className="w-full aspect-[3/2] rounded-xl" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
