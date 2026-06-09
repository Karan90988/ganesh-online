"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartLineInput } from "@/store/cart";
import { useToast } from "@/components/ui/toast";

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
  const toast = useToast();

  const inCart = items[line.key]?.quantity ?? 0;

  if (outOfStock) {
    return (
      <Button variant="secondary" size={size} disabled className={full ? "w-full" : ""}>
        Out of Stock
      </Button>
    );
  }

  if (inCart === 0) {
    return (
      <Button
        size={size}
        variant={line.variant.startsWith("WHOLESALE_PACK") ? "outline" : "default"}
        className={full ? "w-full" : ""}
        onClick={() => {
          addLine(line);
          toast.success("Added to cart", line.displayName);
        }}
      >
        <ShoppingCart className="h-5 w-5" />
        {buttonLabel}
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
      <span className="min-w-8 text-center text-base font-bold">
        {inCart} <span className="text-xs font-normal opacity-90">{line.unitLabel}</span>
      </span>
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
