import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="h-full p-6 flex flex-col gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="flex-1 min-h-[300px] rounded-lg" />
    </div>
  );
}
