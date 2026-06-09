"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CartMode, useCart, modeCount, modeTotal } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { useStoreHydrated } from "@/hooks/use-hydrated";

/** Sticky bottom cart bar (Blinkit-style) shown when the cart has items. */
export function CartBar({ mode }: { mode: CartMode }) {
  const hydrated = useStoreHydrated();
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";
  const items = useCart((s) => s.items);
  const count = modeCount(items, mode);
  const total = modeTotal(items, mode);

  if (!hydrated || count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-3">
      <Link
        href={`${basePath}/cart`}
        className="mx-auto flex max-w-2xl items-center justify-between rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg"
      >
        <span className="flex items-center gap-3 font-semibold">
          <span className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
              {count}
            </span>
          </span>
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className="flex items-center gap-2 font-bold">
          {formatCurrency(total)}
          <span className="text-sm">View Cart →</span>
        </span>
      </Link>
    </div>
  );
}
