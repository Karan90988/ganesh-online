import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "./product-grid-skeleton";

/** Placeholder for the product listing while data streams in. */
export function ListingSkeleton() {
  return (
    <div className="container py-4">
      <Skeleton className="mb-3 h-7 w-48" />
      <div className="space-y-3 py-3">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
