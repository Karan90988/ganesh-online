import { revalidateTag } from "next/cache";

// Tag strings must match CACHE_TAGS in "@/lib/queries".

/** Invalidate cached product listings/details after a product/inventory change. */
export function revalidateProducts() {
  revalidateTag("products");
}

/** Invalidate cached categories (and product listings, which show counts). */
export function revalidateCategories() {
  revalidateTag("categories");
  revalidateTag("products");
}
