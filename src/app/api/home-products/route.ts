import { getHomeProducts } from "@/lib/queries";
import { ok, handleError } from "@/lib/api";

/** Public "Popular products" for the home screen (featured + best-sellers). */
export async function GET() {
  try {
    return ok({ products: await getHomeProducts() });
  } catch (error) {
    return handleError(error);
  }
}
