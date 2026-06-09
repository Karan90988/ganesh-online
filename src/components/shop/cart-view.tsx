"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { CartMode, useCart, linesForMode, modeTotal } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { MIN_ORDER_VALUE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useStoreHydrated } from "@/hooks/use-hydrated";

export function CartView({ mode }: { mode: CartMode }) {
  const hydrated = useStoreHydrated();
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";
  const items = useCart((s) => s.items);
  const lines = linesForMode(items, mode);
  const total = modeTotal(items, mode);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const removeLine = useCart((s) => s.removeLine);

  const minValue = MIN_ORDER_VALUE[mode];
  const belowMin = total < minValue;

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Add some products to get started.</p>
        <Link href={basePath}>
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-2xl font-bold">
        Your {mode === "WHOLESALE" ? "Wholesale " : ""}Cart
      </h1>

      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.key} className="flex gap-3 rounded-xl border bg-card p-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={line.imageUrl || `https://placehold.co/200x200/16a34a/ffffff?text=${encodeURIComponent(line.name)}`}
                alt={line.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold">{line.displayName}</p>
                <button
                  onClick={() => removeLine(line.key)}
                  aria-label="Remove item"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(line.unitPrice)} / {line.unitLabel}
                {line.minQty > 1 ? ` · min ${line.minQty} ${line.unitLabel}` : ""}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 rounded-lg border-2 border-input">
                  <button className="flex h-9 w-9 items-center justify-center" onClick={() => decrement(line.key)} aria-label="Decrease">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-12 text-center font-bold">
                    {line.quantity}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">{line.unitLabel}</span>
                  </span>
                  <button className="flex h-9 w-9 items-center justify-center" onClick={() => increment(line.key)} aria-label="Increase">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="font-bold">{formatCurrency(line.unitPrice * line.quantity)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-5 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Grand Total</span>
          <span className="font-extrabold">{formatCurrency(total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Final price confirmed by the shop on WhatsApp. No online payment required.
        </p>

        {belowMin ? (
          <>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-sm font-medium text-amber-800">
              Add {formatCurrency(minValue - total)} more to reach the minimum order of{" "}
              {formatCurrency(minValue)}.
            </p>
            <Link href={basePath} className="mt-3 block">
              <Button size="lg" variant="outline" className="w-full">
                Add more items
              </Button>
            </Link>
          </>
        ) : (
          <Link href={`${basePath}/checkout`} className="mt-4 block">
            <Button size="lg" className="w-full">
              Proceed to Checkout <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
