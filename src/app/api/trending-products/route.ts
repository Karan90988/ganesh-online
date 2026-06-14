import { getTrendingProducts } from "@/lib/queries";
import { ok, handleError } from "@/lib/api";

/** Public "Trending products" for the home screen slider
 *  (admin hand-picked first, then auto-ranked by clicks + sales). */
export async function GET() {
  try {
    return ok({ products: await getTrendingProducts() });
  } catch (error) {
    return handleError(error);
  }
}
