import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";
import { ProductDTO, CategoryDTO } from "@/types";

const PUBLIC_STATUSES = [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK];

// Cache tags — admin write routes call revalidateTag() with these so edits
// show up immediately while normal reads are served from cache.
export const CACHE_TAGS = { products: "products", categories: "categories" };

export const getCategories = unstable_cache(
  async (): Promise<CategoryDTO[]> => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: { where: { status: { in: PUBLIC_STATUSES } } } } },
      },
    });
    return serialize(categories) as unknown as CategoryDTO[];
  },
  ["public-categories"],
  { tags: [CACHE_TAGS.categories, CACHE_TAGS.products], revalidate: 300 }
);

export interface ProductListParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export const getPublicProducts = unstable_cache(
  async (params: ProductListParams) => {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? PAGE_SIZE;

    const where: Prisma.ProductWhereInput = { status: { in: PUBLIC_STATUSES } };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.category) where.category = { slug: params.category };

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

    return {
      products: serialize(products) as unknown as ProductDTO[],
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },
  ["public-products"],
  { tags: [CACHE_TAGS.products], revalidate: 120 }
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDTO | null> => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { name: true, slug: true } } },
    });
    if (!product || product.status === ProductStatus.INACTIVE) return null;
    return serialize(product) as unknown as ProductDTO;
  },
  ["public-product-by-slug"],
  { tags: [CACHE_TAGS.products], revalidate: 120 }
);

export const getRelatedProducts = unstable_cache(
  async (categoryId: string, excludeId: string): Promise<ProductDTO[]> => {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: excludeId },
        status: { in: PUBLIC_STATUSES },
      },
      include: { category: { select: { name: true, slug: true } } },
      take: 6,
      orderBy: { name: "asc" },
    });
    return serialize(products) as unknown as ProductDTO[];
  },
  ["public-related-products"],
  { tags: [CACHE_TAGS.products], revalidate: 120 }
);

/**
 * Products for the home "Popular products" section, in order:
 *   1. Hand-picked featured products (admin curated for seasons/festivals),
 *   2. then best-sellers by quantity sold (excluding ones already shown),
 *   3. then latest active products to fill any remaining slots.
 * Featured and top-sellers are shown TOGETHER (featured first).
 */
export const getHomeProducts = unstable_cache(
  async (): Promise<ProductDTO[]> => {
    const TARGET = 12;
    const include = { category: { select: { name: true, slug: true } } };
    const seen = new Set<string>();
    type P = Awaited<ReturnType<typeof prisma.product.findMany>>[number];
    const combined: P[] = [];
    const addAll = (rows: P[]) => {
      for (const p of rows) {
        if (combined.length >= TARGET) break;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          combined.push(p);
        }
      }
    };

    // 1) Hand-picked featured products
    addAll(
      await prisma.product.findMany({
        where: { isFeatured: true, status: { in: PUBLIC_STATUSES } },
        include,
        orderBy: { updatedAt: "desc" },
        take: TARGET,
      })
    );

    // 2) Best-sellers (excluding any already added)
    if (combined.length < TARGET) {
      const top = await prisma.enquiryItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { productId: { not: null } },
        orderBy: { _sum: { quantity: "desc" } },
        take: TARGET + seen.size,
      });
      const ids = top.map((t) => t.productId).filter((id): id is string => !!id && !seen.has(id));
      if (ids.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: ids }, status: { in: PUBLIC_STATUSES } },
          include,
        });
        const order = new Map(ids.map((id, i) => [id, i]));
        products.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
        addAll(products);
      }
    }

    // 3) Fill remaining with latest active products
    if (combined.length < TARGET) {
      addAll(
        await prisma.product.findMany({
          where: { status: { in: PUBLIC_STATUSES }, id: { notIn: Array.from(seen) } },
          include,
          orderBy: { createdAt: "desc" },
          take: TARGET,
        })
      );
    }

    return serialize(combined) as unknown as ProductDTO[];
  },
  ["home-products"],
  { tags: [CACHE_TAGS.products], revalidate: 120 }
);

/**
 * Products for the home "Trending products" slider, in order:
 *   1. Hand-picked trending products (admin curated),
 *   2. then auto-ranked by popularity = clickCount + units sold (combined),
 * shown TOGETHER (hand-picked first). Mirrors getHomeProducts.
 */
export const getTrendingProducts = unstable_cache(
  async (): Promise<ProductDTO[]> => {
    const TARGET = 12;
    const include = { category: { select: { name: true, slug: true } } };
    const seen = new Set<string>();
    type P = Awaited<ReturnType<typeof prisma.product.findMany>>[number];
    const combined: P[] = [];
    const addAll = (rows: P[]) => {
      for (const p of rows) {
        if (combined.length >= TARGET) break;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          combined.push(p);
        }
      }
    };

    // 1) Hand-picked trending products
    addAll(
      await prisma.product.findMany({
        where: { isTrending: true, status: { in: PUBLIC_STATUSES } },
        include,
        orderBy: { updatedAt: "desc" },
        take: TARGET,
      })
    );

    // 2) Auto-ranked by popularity score = clickCount + total units sold.
    if (combined.length < TARGET) {
      // Units sold per product
      const sales = await prisma.enquiryItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { productId: { not: null } },
      });
      const salesMap = new Map<string, number>();
      for (const s of sales) {
        if (s.productId) salesMap.set(s.productId, s._sum.quantity ?? 0);
      }

      // Candidate pool: most-clicked products + any with sales (union),
      // excluding ones already added. Cap the pool so we don't scan everything.
      const topClicked = await prisma.product.findMany({
        where: { status: { in: PUBLIC_STATUSES }, id: { notIn: Array.from(seen) } },
        include,
        orderBy: { clickCount: "desc" },
        take: 60,
      });
      const soldIds = Array.from(salesMap.keys()).filter((id) => !seen.has(id));
      const missingSold = soldIds.filter((id) => !topClicked.some((p) => p.id === id));
      const soldProducts = missingSold.length
        ? await prisma.product.findMany({
            where: { id: { in: missingSold }, status: { in: PUBLIC_STATUSES } },
            include,
          })
        : [];

      const pool = [...topClicked, ...soldProducts];
      const score = (p: P) => (p.clickCount ?? 0) + (salesMap.get(p.id) ?? 0);
      pool.sort((a, b) => score(b) - score(a));
      addAll(pool);
    }

    // 3) Fill remaining with latest active products
    if (combined.length < TARGET) {
      addAll(
        await prisma.product.findMany({
          where: { status: { in: PUBLIC_STATUSES }, id: { notIn: Array.from(seen) } },
          include,
          orderBy: { createdAt: "desc" },
          take: TARGET,
        })
      );
    }

    return serialize(combined) as unknown as ProductDTO[];
  },
  ["trending-products"],
  { tags: [CACHE_TAGS.products], revalidate: 120 }
);

export interface DashboardRange {
  from: Date;
  to: Date;
}

export async function getDashboardStats({ from, to }: DashboardRange) {
  // createdAt window applied to all order-based analytics
  const range = { gte: from, lte: to };
  const enquiryWhere = { createdAt: range };

  const [
    totalProducts,
    activeProducts,
    outOfStock,
    inactiveProducts,
    totalCustomers,
    newCustomersInRange,
    totalEnquiries,
    newEnquiries,
    wholesaleEnquiries,
    retailEnquiries,
    salesRange,
    valueByType,
    statusGroups,
    recentEnquiries,
    lowStock,
    trendRows,
    topProductRows,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
    prisma.product.count({ where: { status: ProductStatus.INACTIVE } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: range } }),
    prisma.enquiry.count({ where: enquiryWhere }),
    prisma.enquiry.count({ where: { ...enquiryWhere, status: "NEW" } }),
    prisma.enquiry.count({ where: { ...enquiryWhere, type: "WHOLESALE" } }),
    prisma.enquiry.count({ where: { ...enquiryWhere, type: "RETAIL" } }),
    prisma.enquiry.aggregate({ _sum: { grandTotal: true }, where: enquiryWhere }),
    prisma.enquiry.groupBy({ by: ["type"], _sum: { grandTotal: true }, where: enquiryWhere }),
    prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true }, where: enquiryWhere }),
    prisma.enquiry.findMany({
      where: enquiryWhere,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { select: { id: true } } },
    }),
    prisma.product.findMany({
      where: { stockQuantity: { lte: 10 }, status: { not: ProductStatus.INACTIVE } },
      orderBy: { stockQuantity: "asc" },
      take: 6,
      select: { id: true, name: true, stockQuantity: true, unit: true },
    }),
    prisma.enquiry.findMany({
      where: enquiryWhere,
      select: { createdAt: true, grandTotal: true },
    }),
    prisma.enquiryItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, lineTotal: true },
      where: { enquiry: { createdAt: range } },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 6,
    }),
  ]);

  // --- Trend: bucket orders/value by day (<=31d span) or week (longer) ---
  const dayMs = 86400000;
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(to);
  endDay.setHours(0, 0, 0, 0);
  const spanDays = Math.round((endDay.getTime() - startDay.getTime()) / dayMs) + 1;
  const unit: "day" | "week" = spanDays > 31 ? "week" : "day";

  const mondayOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const wd = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - wd);
    return x;
  };
  const keyOf = (d: Date) => {
    const x = unit === "week" ? mondayOf(d) : new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString().slice(0, 10);
  };

  const buckets = new Map<string, { orders: number; value: number }>();
  let cursor = unit === "week" ? mondayOf(startDay) : new Date(startDay);
  while (cursor <= endDay) {
    buckets.set(cursor.toISOString().slice(0, 10), { orders: 0, value: 0 });
    cursor = new Date(cursor.getTime() + (unit === "week" ? 7 : 1) * dayMs);
  }
  for (const row of trendRows) {
    const b = buckets.get(keyOf(new Date(row.createdAt)));
    if (b) {
      b.orders += 1;
      b.value += Number(row.grandTotal);
    }
  }
  const trend = Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    orders: v.orders,
    value: v.value,
  }));

  const salesTotal = Number(salesRange._sum.grandTotal ?? 0);
  const wholesaleValue = Number(valueByType.find((v) => v.type === "WHOLESALE")?._sum.grandTotal ?? 0);
  const retailValue = Number(valueByType.find((v) => v.type === "RETAIL")?._sum.grandTotal ?? 0);

  return serialize({
    totalProducts,
    activeProducts,
    outOfStock,
    inactiveProducts,
    totalCustomers,
    newCustomersInRange,
    totalEnquiries,
    newEnquiries,
    wholesaleEnquiries,
    retailEnquiries,
    salesTotal,
    avgOrderValue: totalEnquiries > 0 ? Math.round(salesTotal / totalEnquiries) : 0,
    wholesaleValue,
    retailValue,
    statusBreakdown: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    trend,
    trendUnit: unit,
    topProducts: topProductRows.map((r) => ({
      name: r.productName,
      quantity: Number(r._sum.quantity ?? 0),
      value: Number(r._sum.lineTotal ?? 0),
    })),
    recentEnquiries,
    lowStock,
  });
}
