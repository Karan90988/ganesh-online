import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder grid shown while the real products load. */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-5 w-1/2" />
            <Skeleton className="mt-1 h-12 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
