import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { revalidateCategories } from "@/lib/revalidate";
import { ok, fail, handleError, serialize } from "@/lib/api";
import { slugify } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = categorySchema.parse(body);
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: slugify(data.name),
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
    revalidateCategories();
    return ok(serialize(category));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return fail(
        `Cannot delete: ${count} product(s) use this category. Move them first.`,
        409
      );
    }
    await prisma.category.delete({ where: { id } });
    revalidateCategories();
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
