import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for a product detail page while it streams in. */
export function ProductDetailSkeleton() {
  return (
    <div className="container py-4">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-14 w-full max-w-xs" />
        </div>
      </div>
    </div>
  );
}
