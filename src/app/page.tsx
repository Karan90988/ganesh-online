import Link from "next/link";
import Image from "next/image";
import { Store, ShoppingBag, Truck, Phone, ArrowRight } from "lucide-react";
import { getCategories, getPublicProducts } from "@/lib/queries";
import { SiteFooter } from "@/components/shop/site-footer";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getPublicProducts({ pageSize: 8 }),
  ]);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">Ganesh Trading</span>
          </div>
          <Link href="/contact">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4" /> Contact
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-accent to-background">
        <div className="container py-10 text-center">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Your trusted kirana store,
            <br />
            <span className="text-primary">now online</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Browse products, build your order and send it on WhatsApp. Wholesale and
            retail prices.
          </p>

          {/* Choose mode */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/retail"
              className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-primary bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </span>
              <span className="text-xl font-bold">Shop Retail</span>
              <span className="text-sm text-muted-foreground">For homes & families</span>
              <span className="mt-1 flex items-center gap-1 font-semibold text-primary">
                Start shopping <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/wholesale"
              className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-input bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Truck className="h-7 w-7 text-primary" />
              </span>
              <span className="text-xl font-bold">Shop Wholesale</span>
              <span className="text-sm text-muted-foreground">For shops & businesses</span>
              <span className="mt-1 flex items-center gap-1 font-semibold text-primary">
                Bulk prices <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-8">
        <h2 className="mb-4 text-xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/retail?category=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-shadow hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-primary">
                {c.name.charAt(0)}
              </span>
              <span className="text-xs font-semibold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Popular products</h2>
          <Link href="/retail" className="text-sm font-semibold text-primary">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/retail/product/${p.slug}`}
              className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={p.imageUrl || `https://placehold.co/400x400/16a34a/ffffff?text=${encodeURIComponent(p.name)}`}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                <p className="mt-1 font-bold text-primary">₹{p.retailPrice}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
