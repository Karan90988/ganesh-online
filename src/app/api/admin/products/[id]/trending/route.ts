import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidateProducts } from "@/lib/revalidate";
import { ok, handleError, serialize } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Toggle whether a product appears in the home "Trending products" slider. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const isTrending = Boolean(body.isTrending);

    const product = await prisma.product.update({
      where: { id },
      data: { isTrending },
    });
    revalidateProducts();
    return ok(serialize(product));
  } catch (error) {
    return handleError(error);
  }
}
