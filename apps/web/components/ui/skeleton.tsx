import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-primary/10", className)}
      {...props}
    >
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
  )
}

export { Skeleton }
