import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
            <Link key={c.id} href={`/retail?category=${c.slug}`} className="group">
              <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-accent text-3xl font-bold text-primary transition-shadow group-hover:shadow-md">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
                ) : (
                  c.name.charAt(0)
                )}
              </span>
              <span className="mt-2 block font-semibold">{c.name}</span>
              <span className="block text-sm text-muted-foreground">{c._count?.products ?? 0} products</span>
            </Link>
          ))}
        </div>
      </div>
    </ShopShell>
  );
}
