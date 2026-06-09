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

export async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    outOfStock,
    totalCustomers,
    totalEnquiries,
    wholesaleEnquiries,
    retailEnquiries,
    newEnquiries,
    recentEnquiries,
    lowStock,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
    prisma.customer.count(),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { type: "WHOLESALE" } }),
    prisma.enquiry.count({ where: { type: "RETAIL" } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.findMany({
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
  ]);

  return serialize({
    totalProducts,
    activeProducts,
    outOfStock,
    totalCustomers,
    totalEnquiries,
    wholesaleEnquiries,
    retailEnquiries,
    newEnquiries,
    recentEnquiries,
    lowStock,
  });
}
