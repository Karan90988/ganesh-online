"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { CartMode, useCart, linesForMode, modeTotal } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStoreHydrated } from "@/hooks/use-hydrated";
import { useStoreSettings } from "@/hooks/use-settings";
import { useT } from "@/i18n/context";
import { QtyInput } from "./qty-input";

export function CartView({ mode }: { mode: CartMode }) {
  const hydrated = useStoreHydrated();
  const t = useT();
  const basePath = mode === "WHOLESALE" ? "/wholesale" : "/retail";
  const items = useCart((s) => s.items);
  const lines = linesForMode(items, mode);
  const total = modeTotal(items, mode);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const settings = useStoreSettings();

  const isRetail = mode === "RETAIL";
  const deliveryCharge =
    isRetail && total < settings.retailFreeDeliveryThreshold ? settings.retailDeliveryCharge : 0;
  const grand = total + deliveryCharge;
  const minValue = settings.wholesaleMinOrderValue;
  const belowMin = !isRetail && total < minValue;
  const freeDeliveryGap = settings.retailFreeDeliveryThreshold - total;

  if (!hydrated) return null;

  if (lines.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("cart.empty")}</h1>
        <p className="text-muted-foreground">{t("cart.emptyDesc")}</p>
        <Link href={basePath}>
          <Button size="lg">{t("common.browseProducts")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-2xl font-bold">{t("cart.title")}</h1>

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
                  <QtyInput
                    value={line.quantity}
                    min={line.minQty}
                    unitLabel={line.unitLabel}
                    onCommit={(q) => setQuantity(line.key, q)}
                  />
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
        {isRetail ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("common.subtotal")}</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("common.delivery")}</span>
              {deliveryCharge > 0 ? (
                <span>{formatCurrency(deliveryCharge)}</span>
              ) : (
                <span className="font-bold text-primary">{t("common.free")}</span>
              )}
            </div>
            <div className="flex items-center justify-between border-t pt-1.5 text-lg">
              <span className="font-semibold">{t("common.grandTotal")}</span>
              <span className="font-extrabold">{formatCurrency(grand)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold">{t("common.grandTotal")}</span>
            <span className="font-extrabold">{formatCurrency(total)}</span>
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{t("cart.priceNote")}</p>

        {isRetail && deliveryCharge > 0 && (
          <p className="mt-3 rounded-lg bg-accent/60 p-2.5 text-center text-xs font-medium text-accent-foreground">
            {t("cart.freeDeliveryHint", { more: formatCurrency(freeDeliveryGap) })}
          </p>
        )}

        {belowMin ? (
          <>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-sm font-medium text-amber-800">
              {t("cart.minNotice", {
                more: formatCurrency(minValue - total),
                min: formatCurrency(minValue),
              })}
            </p>
            <Link href={basePath} className="mt-3 block">
              <Button size="lg" variant="outline" className="w-full">
                {t("common.addMore")}
              </Button>
            </Link>
          </>
        ) : (
          <Link href={`${basePath}/checkout`} className="mt-4 block">
            <Button size="lg" className="w-full">
              {t("common.proceedToCheckout")} <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
