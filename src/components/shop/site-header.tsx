"use client";

import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartMode, useCart, modeCount } from "@/store/cart";
import { useStoreHydrated } from "@/hooks/use-hydrated";

export function SiteHeader({ mode }: { mode: CartMode }) {
  const hydrated = useStoreHydrated();
  const items = useCart((s) => s.items);
  const count = modeCount(items, mode);
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </span>
          <span className="text-base font-bold leading-tight sm:text-lg">
            Ganesh Trading
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border-2 border-input p-0.5 text-sm font-semibold">
            <Link
              href="/retail"
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                mode === "RETAIL" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Retail
            </Link>
            <Link
              href="/wholesale"
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                mode === "WHOLESALE" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Wholesale
            </Link>
          </div>

          <Link
            href={`${basePath}/cart`}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg border-2 border-input"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
