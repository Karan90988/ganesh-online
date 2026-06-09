import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes = ["", "/retail", "/wholesale", "/categories", "/contact"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: { not: "INACTIVE" } },
      select: { slug: true, updatedAt: true },
    });
    productRoutes = products.flatMap((p) => [
      {
        url: `${siteUrl}/retail/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${siteUrl}/wholesale/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ]);
  } catch {
    // DB not reachable at build time — return static routes only.
  }

  return [...staticRoutes, ...productRoutes];
}
