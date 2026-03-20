export default function CollectionDetailLoading() {
  return (
    <div className="px-4 pb-10 pt-12 md:px-10 md:pt-16 max-w-[800px] mx-auto w-full space-y-6 animate-pulse">
      {/* Back button + title */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
          <div className="h-10 w-64 rounded-lg bg-muted" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <div className="h-8 w-36 rounded-md bg-muted" />
          <div className="h-8 w-28 rounded-md bg-muted" />
          <div className="h-8 w-36 rounded-md bg-muted" />
        </div>
      </div>

      {/* Finding cards */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-5 rounded-lg border-2 border-black/[0.05] bg-white p-4 items-start"
        >
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
          <div className="w-[200px] h-32 rounded-lg bg-muted shrink-0" />
        </div>
      ))}
    </div>
  );
}
