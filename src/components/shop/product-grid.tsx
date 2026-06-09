import { ProductCard } from "./product-card";
import { ProductDTO } from "@/types";
import { CartMode } from "@/store/cart";
import { PackageOpen } from "lucide-react";

export function ProductGrid({
  products,
  basePath,
  mode,
}: {
  products: ProductDTO[];
  basePath: string;
  mode: CartMode;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <PackageOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm text-muted-foreground">Try a different search or category.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} basePath={basePath} mode={mode} />
      ))}
    </div>
  );
}
