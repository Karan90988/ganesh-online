import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { bulkFields } from "@/lib/product-bulk";
import { revalidateProducts } from "@/lib/revalidate";
import { ok, fail, handleError, serialize } from "@/lib/api";
import { slugify } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) return fail("Product not found", 404);
    return ok(serialize(product));
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: slugify(data.name) || slugify(data.sku),
        sku: data.sku,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        categoryId: data.categoryId,
        mrp: data.mrp,
        wholesalePrice: data.wholesalePrice,
        retailPrice: data.retailPrice,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        status: data.status,
        channel: data.channel,
        ...bulkFields(data),
      },
    });
    revalidateProducts();
    return ok(serialize(product));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    revalidateProducts();
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
