import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="max-w-[720px] mx-auto w-full px-4 pb-10 pt-12 md:px-10 md:pt-16 space-y-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
