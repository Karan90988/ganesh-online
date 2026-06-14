import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

/** Records a product-detail view (fire-and-forget from clients). Used to
 *  auto-rank the home "Trending products" slider by clicks + sales. */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    await prisma.product.updateMany({
      where: { slug },
      data: { clickCount: { increment: 1 } },
    });
    // No cache revalidation here — trending refreshes on its own interval to
    // avoid busting the products cache on every single tap.
    return ok({ tracked: true });
  } catch (error) {
    return handleError(error);
  }
}
