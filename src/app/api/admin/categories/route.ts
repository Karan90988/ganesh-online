import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { revalidateCategories } from "@/lib/revalidate";
import { ok, created, handleError, serialize } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return ok(serialize(categories));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = categorySchema.parse(body);
    const category = await prisma.category.create({
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
    return created(serialize(category));
  } catch (error) {
    return handleError(error);
  }
}
