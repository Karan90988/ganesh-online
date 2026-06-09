import { Suspense } from "react";
import { CartMode } from "@/store/cart";
import { getCategories, getPublicProducts } from "@/lib/queries";
import { SearchBar } from "./search-bar";
import { CategoryChips } from "./category-chips";
import { ProductGrid } from "./product-grid";
import { Pagination } from "./pagination";

interface Props {
  mode: CartMode;
  searchParamsPromise: Promise<{ search?: string; category?: string; page?: string }>;
}

/**
 * Shared product listing used by both /retail and /wholesale sections.
 * Awaits searchParams internally so the page can stream it inside a Suspense
 * boundary (header/footer render instantly, products stream in after).
 */
export async function ProductListing({ mode, searchParamsPromise }: Props) {
  const searchParams = await searchParamsPromise;
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";
  const page = parseInt(searchParams.page || "1", 10);

  const [categories, { products, pagination }] = await Promise.all([
    getCategories(),
    getPublicProducts({
      search: searchParams.search,
      category: searchParams.category,
      page,
    }),
  ]);

  return (
    <div className="container py-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">
          {mode === "WHOLESALE" ? "Wholesale Products" : "Retail Products"}
        </h1>
        <span className="text-sm text-muted-foreground">{pagination.total} items</span>
      </div>
      {mode === "WHOLESALE" && (
        <p className="mb-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          You are viewing <strong>wholesale (bulk) prices</strong>. Minimum quantities may apply.
        </p>
      )}

      <div className="sticky top-16 z-20 -mx-4 space-y-3 bg-background/95 px-4 py-3 backdrop-blur">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <CategoryChips categories={categories} />
        </Suspense>
      </div>

      <div className="mt-4">
        <ProductGrid products={products} basePath={basePath} mode={mode} />
        <Suspense>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} />
        </Suspense>
      </div>
    </div>
  );
}
