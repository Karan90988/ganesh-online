"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartLineInput } from "@/store/cart";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/i18n/context";
import { QtyInput } from "./qty-input";

interface Props {
  line: CartLineInput;
  buttonLabel?: string;
  outOfStock?: boolean;
  size?: "default" | "lg";
  full?: boolean;
}

/**
 * Add-to-cart control for a single cart line (one product variant). Becomes a
 * +/- stepper once in the cart; decrementing below the line's minQty removes it.
 */
export function AddToCart({ line, buttonLabel = "Add", outOfStock, size = "default", full }: Props) {
  const items = useCart((s) => s.items);
  const addLine = useCart((s) => s.addLine);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const setQuantity = useCart((s) => s.setQuantity);
  const toast = useToast();
  const t = useT();

  const inCart = items[line.key]?.quantity ?? 0;
  // Translate the plain "Add"; keep pack-specific labels (e.g. "Add Sack") as-is.
  const label = buttonLabel === "Add" ? t("common.add") : buttonLabel;

  if (outOfStock) {
    return (
      <Button variant="secondary" size={size} disabled className={full ? "w-full" : ""}>
        {t("common.outOfStock")}
      </Button>
    );
  }

  if (inCart === 0) {
    return (
      <Button
        size={size}
        className={full ? "w-full" : ""}
        onClick={() => {
          addLine(line);
          toast.success("Added to cart", line.displayName);
        }}
      >
        <ShoppingCart className="h-5 w-5" />
        {label}
      </Button>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-1 rounded-lg bg-primary text-primary-foreground ${
        full ? "w-full" : ""
      } ${size === "lg" ? "h-14" : "h-12"} px-1`}
    >
      <button
        aria-label="Decrease quantity"
        className="flex h-full items-center justify-center px-3 hover:bg-white/10 rounded-md"
        onClick={() => decrement(line.key)}
      >
        <Minus className="h-5 w-5" />
      </button>
      <QtyInput
        value={inCart}
        min={line.minQty}
        unitLabel={line.unitLabel}
        dark
        onCommit={(q) => setQuantity(line.key, q)}
      />
      <button
        aria-label="Increase quantity"
        className="flex h-full items-center justify-center px-3 hover:bg-white/10 rounded-md"
        onClick={() => increment(line.key)}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
