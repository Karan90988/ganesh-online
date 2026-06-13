import Link from "next/link";
import Image from "next/image";
import { Store, ShoppingBag, Truck, ArrowRight, Zap, CalendarClock } from "lucide-react";
import { getCategories, getHomeProducts } from "@/lib/queries";
import { SiteFooter } from "@/components/shop/site-footer";
import { LanguageSwitcher } from "@/components/shop/language-switcher";
import { PromoBanner } from "@/components/shop/promo-banner";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getServerT();
  const [categories, products] = await Promise.all([getCategories(), getHomeProducts()]);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b">
        <div className="container relative flex h-16 items-center justify-between gap-2 sm:justify-end">
          {/* Brand — centered on larger screens, left on mobile */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            <span className="truncate text-sm font-extrabold sm:text-2xl">
              Ganesh Trading Company
            </span>
          </Link>
          {/* Controls — top right */}
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-accent to-background">
        <div className="container py-10 text-center">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            {t("home.heroTitle1")}
            <br />
            <span className="text-primary">{t("home.heroTitle2")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t("home.heroSubtitle")}</p>

          {/* Rotating promo banner */}
          <PromoBanner />

          {/* Choose mode */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/retail"
              className="group relative flex flex-col items-center gap-2 rounded-2xl border-2 border-primary bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                {t("home.retailBadge")}
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </span>
              <span className="text-xl font-bold">{t("home.shopRetail")}</span>
              <span className="text-sm text-muted-foreground">{t("home.shopRetailDesc")}</span>
              <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                <Zap className="h-3.5 w-3.5" /> {t("home.retailDelivery")}
              </span>
              <span className="mt-1 flex items-center gap-1 font-semibold text-primary">
                {t("home.startShopping")} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/wholesale"
              className="group relative flex flex-col items-center gap-2 rounded-2xl border-2 border-primary bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-sm">
                {t("home.wholesaleBadge")}
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Truck className="h-7 w-7 text-primary" />
              </span>
              <span className="text-xl font-bold">{t("home.shopWholesale")}</span>
              <span className="text-sm text-muted-foreground">{t("home.shopWholesaleDesc")}</span>
              <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                <CalendarClock className="h-3.5 w-3.5" /> {t("home.wholesaleDelivery")}
              </span>
              <span className="mt-1 flex items-center gap-1 font-semibold text-primary">
                {t("home.bulkPrices")} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-8">
        <h2 className="mb-4 text-xl font-bold">{t("home.shopByCategory")}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`/retail?category=${c.slug}`} className="group text-center">
              <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-accent text-2xl font-bold text-primary transition-shadow group-hover:shadow-md">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.name} fill sizes="(max-width:768px) 33vw, 16vw" className="object-cover" />
                ) : (
                  c.name.charAt(0)
                )}
              </span>
              <span className="mt-2 block text-xs font-semibold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("home.popularProducts")}</h2>
          <Link href="/retail" className="text-sm font-semibold text-primary">
            {t("common.viewAll")} →
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

      {/* Contact section */}
      <section className="container pb-12">
        <div className="rounded-2xl border bg-accent/40 p-6 text-center">
          <h2 className="text-xl font-bold">{t("contact.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contact.subtitle")}</p>
          <div className="mt-4 flex justify-center">
            <Link href="/contact">
              <Button size="lg">
                {t("common.contact")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
