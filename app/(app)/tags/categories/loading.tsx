import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="max-w-[720px] mx-auto w-full px-6 pb-10 pt-12 md:px-10 md:pt-16 space-y-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
