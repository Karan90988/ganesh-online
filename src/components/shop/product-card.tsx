"use client";

import Image from "next/image";
import Link from "next/link";
import { CartMode } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddToCart } from "./add-to-cart";
import { getCartOptions } from "@/lib/cart-lines";
import { ProductDTO } from "@/types";

export function ProductCard({
  product,
  basePath,
  mode,
}: {
  product: ProductDTO;
  basePath: string;
  mode: CartMode;
}) {
  const outOfStock = product.status === "OUT_OF_STOCK" || product.stockQuantity <= 0;
  const options = getCartOptions(product, mode);
  const lead = options[0].input.unitPrice;
  const savings = product.mrp > lead ? Math.round(((product.mrp - lead) / product.mrp) * 100) : 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`${basePath}/product/${product.slug}`} className="relative block aspect-square bg-muted">
        <Image
          src={product.imageUrl || `https://placehold.co/400x400/16a34a/ffffff?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
        {savings > 0 && <Badge className="absolute left-2 top-2 bg-brand">{savings}% OFF</Badge>}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-gray-800">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`${basePath}/product/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto space-y-2">
          {options.map((opt) => (
            <div key={opt.input.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(opt.input.unitPrice)}
                  <span className="text-xs font-normal text-muted-foreground"> / {opt.input.unitLabel}</span>
                  {opt.input.packSize == null && product.mrp > opt.input.unitPrice && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground line-through">
                      {formatCurrency(product.mrp)}
                    </span>
                  )}
                </span>
                {opt.subLabel && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    {opt.subLabel}
                  </span>
                )}
              </div>
              {opt.input.packSize == null && product.mrp > opt.input.unitPrice && (
                <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-bold text-green-700">
                  Save {formatCurrency(product.mrp - opt.input.unitPrice)}
                </span>
              )}
              {opt.packInfo && (
                <p className="text-[11px] text-muted-foreground">{opt.packInfo}</p>
              )}
              <AddToCart line={opt.input} buttonLabel={opt.buttonLabel} outOfStock={outOfStock} full />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
