import { NextRequest } from "next/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ok, fail, handleError } from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

/** Public product detail (for the mobile app & any client). Returns the product
 *  plus related products from the same category. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return fail("Product not found", 404);
    const related = product.categoryId
      ? await getRelatedProducts(product.categoryId, product.id)
      : [];
    return ok({ product, related });
  } catch (error) {
    return handleError(error);
  }
}
