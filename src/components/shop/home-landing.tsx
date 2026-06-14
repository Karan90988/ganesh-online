"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ShoppingBag, Box, Search, TrendingUp, Zap, CalendarClock } from "lucide-react";
import { LanguageSwitcher } from "@/components/shop/language-switcher";
import { PromoBanner } from "@/components/shop/promo-banner";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { getCartOptions } from "@/lib/cart-lines";
import { useT } from "@/i18n/context";
import { CategoryDTO, ProductDTO } from "@/types";

type Mode = "RETAIL" | "WHOLESALE";

// Per-mode chrome: green for retail, saffron for wholesale.
const THEME = {
  RETAIL: {
    header: "bg-primary",
    page: "bg-green-50",
    accentText: "text-primary",
    tileBorder: "border-green-200",
    icon: ShoppingBag,
    delivery: "retailDelivery" as const,
    deliveryIcon: Zap,
    path: "/retail",
  },
  WHOLESALE: {
    header: "bg-amber-600",
    page: "bg-amber-50",
    accentText: "text-amber-700",
    tileBorder: "border-amber-200",
    icon: Box,
    delivery: "wholesaleDelivery" as const,
    deliveryIcon: CalendarClock,
    path: "/wholesale",
  },
};

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
  const theme = THEME[mode];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `${theme.path}?search=${encodeURIComponent(q)}` : theme.path);
  };

  return (
    <div className={`min-h-screen ${theme.page} transition-colors`}>
      {/* Themed header */}
      <header className={`${theme.header} text-white transition-colors`}>
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Store className="h-5 w-5" />
            </span>
            <span className="truncate text-sm font-extrabold sm:text-xl">Ganesh Trading Company</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Retail / Wholesale section tabs */}
        <div className="container grid grid-cols-2 gap-3 pb-4">
          {(["RETAIL", "WHOLESALE"] as Mode[]).map((m) => {
            const tm = THEME[m];
            const active = mode === m;
            const Icon = tm.icon;
            const DeliveryIcon = tm.deliveryIcon;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex flex-col items-center rounded-xl px-4 py-2.5 text-center transition-colors ${
                  active ? "bg-white shadow-sm" : "bg-white/15 hover:bg-white/25"
                }`}
              >
                <span className={`flex items-center gap-1.5 text-base font-extrabold ${active ? tm.accentText : "text-white"}`}>
                  <Icon className="h-4 w-4" />
                  {m === "RETAIL" ? t("home.shopRetail") : t("home.shopWholesale")}
                </span>
                <span className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold ${active ? "text-muted-foreground" : "text-white/85"}`}>
                  <DeliveryIcon className="h-3 w-3" />
                  {t(`home.${tm.delivery}`)}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Promo banner */}
      <div className="container">
        <PromoBanner />
      </div>

      {/* Search */}
      <section className="container mt-5">
        <form onSubmit={submitSearch} className="relative mx-auto max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="bg-white pl-11"
            inputMode="search"
          />
        </form>
      </section>

      {/* Categories */}
      <section className="container py-7">
        <h2 className="mb-4 text-xl font-bold">{t("home.shopByCategory")}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`${theme.path}?category=${c.slug}`} className="group text-center">
              <span
                className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-white text-2xl font-bold transition-shadow group-hover:shadow-md ${theme.tileBorder} ${theme.accentText}`}
              >
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
            <TrendingUp className={`h-5 w-5 ${theme.accentText}`} /> {t("home.trending")}
          </h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {trending.map((p) => {
              const lead = getCartOptions(p, mode)[0].input.unitPrice;
              const showMrp = p.mrp > lead;
              return (
                <Link
                  key={p.id}
                  href={`${theme.path}/product/${p.slug}`}
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
                    <p className={`mt-1 font-bold ${theme.accentText}`}>{formatCurrency(lead)}</p>
                    {showMrp && (
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(p.mrp)}</p>
                    )}
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
