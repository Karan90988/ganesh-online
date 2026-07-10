import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { bulkFields } from "@/lib/product-bulk";
import { revalidateProducts } from "@/lib/revalidate";
import { ok, created, handleError, serialize } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";

// List products (admin sees all statuses)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";
    const lowStock = searchParams.get("lowStock") === "1";
    const featured = searchParams.get("featured") === "1";
    const trending = searchParams.get("trending") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const where: Prisma.ProductWhereInput = {};
    if (featured) where.isFeatured = true;
    if (trending) where.isTrending = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status as Prisma.ProductWhereInput["status"];
    if (lowStock) where.stockQuantity = { lte: 10 };

    const sort = searchParams.get("sort") || "";
    let orderBy: Prisma.ProductOrderByWithRelationInput = { updatedAt: "desc" };
    if (sort === "stock_asc") orderBy = { stockQuantity: "asc" };
    else if (sort === "stock_desc") orderBy = { stockQuantity: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true } } },
        orderBy,
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
      }),
    ]);

    return ok({
      products: serialize(products),
      pagination: { page, pageSize: ADMIN_PAGE_SIZE, total, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Create product
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
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
    return created(serialize(product));
  } catch (error) {
    return handleError(error);
  }
}
