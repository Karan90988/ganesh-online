import { prisma } from "@/lib/prisma";
import { ok, handleError, serialize } from "@/lib/api";

/** Public category listing with product counts (active categories only). */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            products: { where: { status: { not: "INACTIVE" } } },
          },
        },
      },
    });
    return ok(serialize(categories));
  } catch (error) {
    return handleError(error);
  }
}
