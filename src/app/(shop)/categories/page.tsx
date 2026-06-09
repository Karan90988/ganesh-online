import { Metadata } from "next";
import Link from "next/link";
import { ShopShell } from "@/components/shop/shop-shell";
import { getCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all product categories at Ganesh Trading Company.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <ShopShell mode="RETAIL">
      <div className="container py-6">
        <h1 className="mb-4 text-2xl font-bold">All Categories</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/retail?category=${c.slug}`}
              className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-primary">
                {c.name.charAt(0)}
              </span>
              <span className="font-semibold">{c.name}</span>
              <span className="text-sm text-muted-foreground">
                {c._count?.products ?? 0} products
              </span>
            </Link>
          ))}
        </div>
      </div>
    </ShopShell>
  );
}
