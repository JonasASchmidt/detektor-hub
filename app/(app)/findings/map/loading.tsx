import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="h-full p-6 flex flex-col gap-3">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="flex-1 min-h-[300px] rounded-xl" />
    </div>
  );
}
