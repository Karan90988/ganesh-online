"use client";

import { useEffect } from "react";
import Image from "next/image";
import { CartMode } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { UNIT_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { AddToCart } from "./add-to-cart";
import { getCartOptions } from "@/lib/cart-lines";
import { ProductDTO } from "@/types";

export function ProductDetail({ product, mode }: { product: ProductDTO; mode: CartMode }) {
  // Record a view (fire-and-forget) to feed the Trending ranking.
  useEffect(() => {
    fetch(`/api/products/${product.slug}/click`, { method: "POST" }).catch(() => {});
  }, [product.slug]);

  const outOfStock = product.status === "OUT_OF_STOCK" || product.stockQuantity <= 0;
  const options = getCartOptions(product, mode);
  const lead = options[0].input.unitPrice;
  const savings = product.mrp > lead ? Math.round(((product.mrp - lead) / product.mrp) * 100) : 0;

  return (
    <div className="container py-4">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={product.imageUrl || `https://placehold.co/600x600/16a34a/ffffff?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {savings > 0 && <Badge className="absolute left-3 top-3 bg-primary text-base">{savings}% OFF</Badge>}
        </div>

        <div>
          {product.category && (
            <Badge variant="secondary" className="mb-2">{product.category.name}</Badge>
          )}
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SKU: {product.sku} · Per {UNIT_LABELS[product.unit]}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline">{mode === "WHOLESALE" ? "Wholesale pricing" : "Retail price"}</Badge>
            {outOfStock ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">In Stock</Badge>
            )}
          </div>

          {product.description && (
            <div className="mt-5">
              <h2 className="mb-1 font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Buy options */}
          <div className="mt-6 space-y-3">
            {options.map((opt) => (
              <div key={opt.input.key} className="rounded-xl border p-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-bold text-primary">{opt.priceLabel}</p>
                      {opt.input.packSize == null && product.mrp > opt.input.unitPrice && (
                        <span className="text-sm font-medium text-muted-foreground line-through">
                          MRP {formatCurrency(product.mrp)}
                        </span>
                      )}
                    </div>
                    {opt.input.packSize == null && product.mrp > opt.input.unitPrice && (
                      <span className="mt-1 inline-block rounded bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                        You save {formatCurrency(product.mrp - opt.input.unitPrice)}
                      </span>
                    )}
                    {opt.packInfo && (
                      <p className="text-xs text-muted-foreground">{opt.packInfo}</p>
                    )}
                  </div>
                  {opt.subLabel && (
                    <span className="rounded bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                      {opt.subLabel}
                    </span>
                  )}
                </div>
                <div className="mt-2 max-w-xs">
                  <AddToCart line={opt.input} buttonLabel={opt.buttonLabel} outOfStock={outOfStock} size="lg" full />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
