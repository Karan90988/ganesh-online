"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ShoppingBag, Box, Search, TrendingUp, Zap, CalendarClock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shop/language-switcher";
import { PromoBanner } from "@/components/shop/promo-banner";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { getCartOptions } from "@/lib/cart-lines";
import { useT } from "@/i18n/context";
import { CategoryDTO, ProductDTO } from "@/types";

type Mode = "RETAIL" | "WHOLESALE";

const MODES = {
  RETAIL: { icon: ShoppingBag, delivery: "retailDelivery", deliveryIcon: Zap, path: "/retail" },
  WHOLESALE: { icon: Box, delivery: "wholesaleDelivery", deliveryIcon: CalendarClock, path: "/wholesale" },
} as const;

export function HomeLanding({
  categories,
  trending,
}: {
  categories: CategoryDTO[];
  trending: ProductDTO[];
}) {
  const t = useT();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("RETAIL");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<ProductDTO[]>([]);
  const path = MODES[mode].path;

  // Live product suggestions from the DB as the customer types (debounced).
  useEffect(() => {
    const q = search.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&pageSize=8`);
        const json = await res.json();
        if (json?.success) setSuggestions(json.data.products);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `${path}?search=${encodeURIComponent(q)}` : path);
  };

  return (
    <div className={cn("min-h-screen bg-accent transition-colors", mode === "WHOLESALE" && "theme-wholesale")}>
      {/* Themed header */}
      <header className="bg-primary text-primary-foreground transition-colors">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Store className="h-5 w-5" />
            </span>
            <span className="truncate text-sm font-extrabold sm:text-xl">Ganesh Trading Company</span>
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Retail / Wholesale — folder tabs (active tab merges into the panel below) */}
        <div className="container flex items-end gap-2">
          {(["RETAIL", "WHOLESALE"] as Mode[]).map((m) => {
            const active = mode === m;
            const Icon = MODES[m].icon;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  active
                    ? "rounded-t-2xl bg-accent px-6 py-3.5 text-lg font-extrabold text-primary"
                    : "rounded-t-xl bg-white/20 px-5 py-2.5 font-bold text-white hover:bg-white/30"
                )}
              >
                <Icon className={active ? "h-5 w-5" : "h-4 w-4"} />
                {m === "RETAIL" ? t("home.shopRetail") : t("home.shopWholesale")}
              </button>
            );
          })}
        </div>
      </header>

      {/* Delivery hours for the selected section */}
      <p className="container mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-primary">
        <Clock className="h-4 w-4" />
        {t("home.deliveryHours")}
      </p>

      {/* Promo banner */}
      <div className="container">
        <PromoBanner />
      </div>

      {/* Search with live suggestions */}
      <section className="container mt-5">
        <div className="relative mx-auto max-w-2xl">
          <form onSubmit={submitSearch}>
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="bg-white pl-11"
              inputMode="search"
            />
          </form>
          {search.trim().length > 0 && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-card shadow-lg">
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  href={`${path}/product/${p.slug}`}
                  onClick={() => {
                    setSearch("");
                    setSuggestions([]);
                  }}
                  className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-accent"
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={p.imageUrl || `https://placehold.co/80x80/16a34a/ffffff?text=${encodeURIComponent(p.name.charAt(0))}`}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </span>
                  <span className="line-clamp-1 flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(getCartOptions(p, mode)[0].input.unitPrice)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-7">
        <h2 className="mb-4 text-xl font-bold">{t("home.shopByCategory")}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`${path}?category=${c.slug}`} className="group text-center">
              <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-white text-2xl font-bold text-primary transition-shadow group-hover:shadow-md">
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

      {/* Trending products — horizontal slider */}
      {trending.length > 0 && (
        <section className="container pb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="h-5 w-5 text-primary" /> {t("home.trending")}
          </h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {trending.map((p) => {
              const lead = getCartOptions(p, mode)[0].input.unitPrice;
              const showMrp = p.mrp > lead;
              return (
                <Link
                  key={p.id}
                  href={`${path}/product/${p.slug}`}
                  className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={p.imageUrl || `https://placehold.co/400x400/16a34a/ffffff?text=${encodeURIComponent(p.name)}`}
                      alt={p.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">{p.name}</p>
                    <p className="mt-1 font-bold text-primary">{formatCurrency(lead)}</p>
                    {showMrp && <p className="text-xs text-muted-foreground line-through">{formatCurrency(p.mrp)}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
