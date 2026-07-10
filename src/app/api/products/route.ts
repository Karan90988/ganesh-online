import { NextRequest } from "next/server";
import { Prisma, ProductStatus, ProductChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, handleError, serialize } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * Public product listing.
 * Query params: search, category (slug), page, pageSize.
 * Only ACTIVE / OUT_OF_STOCK products are returned (never INACTIVE).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categorySlug = searchParams.get("category")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      48,
      parseInt(searchParams.get("pageSize") || String(PAGE_SIZE), 10)
    );
    const mode = searchParams.get("mode")?.toUpperCase();

    const where: Prisma.ProductWhereInput = {
      status: { in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] },
    };

    if (mode === "RETAIL") {
      where.channel = { in: [ProductChannel.BOTH, ProductChannel.RETAIL_ONLY] };
    } else if (mode === "WHOLESALE") {
      where.channel = { in: [ProductChannel.BOTH, ProductChannel.WHOLESALE_ONLY] };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: [{ status: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      products: serialize(products),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
