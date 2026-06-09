"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartMode = "WHOLESALE" | "RETAIL";
export type LineVariant =
  | "RETAIL"
  | "WHOLESALE_LOOSE"
  | "WHOLESALE_PACK1"
  | "WHOLESALE_PACK2";

export interface CartLine {
  key: string; // `${productId}__${variant}`
  productId: string;
  variant: LineVariant;
  name: string; // base product name
  displayName: string; // name + variant suffix, e.g. "Basmati Rice (Sack 26 Kg)"
  slug: string;
  sku: string;
  imageUrl?: string | null;
  unitLabel: string; // "Kg", "Litre", "Sack", ...
  unitPrice: number; // price per unit of this variant
  quantity: number;
  minQty: number; // minimum order quantity for this line
  packSize?: number | null; // base units per pack (for WHOLESALE_PACK display)
}

export type CartLineInput = Omit<CartLine, "quantity">;

interface CartState {
  items: Record<string, CartLine>;
  addLine: (line: CartLineInput, qty?: number) => void;
  setQuantity: (key: string, qty: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  clearMode: (mode: CartMode) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},

      addLine: (line, qty) =>
        set((state) => {
          const existing = state.items[line.key];
          const add = qty ?? line.minQty;
          const nextQty = (existing?.quantity ?? 0) + add;
          return {
            items: {
              ...state.items,
              [line.key]: { ...line, quantity: Math.max(line.minQty, nextQty) },
            },
          };
        }),

      setQuantity: (key, qty) =>
        set((state) => {
          const item = state.items[key];
          if (!item) return state;
          if (qty < item.minQty) {
            const next = { ...state.items };
            delete next[key];
            return { items: next };
          }
          return { items: { ...state.items, [key]: { ...item, quantity: qty } } };
        }),

      increment: (key) =>
        set((state) => {
          const item = state.items[key];
          if (!item) return state;
          return { items: { ...state.items, [key]: { ...item, quantity: item.quantity + 1 } } };
        }),

      decrement: (key) =>
        set((state) => {
          const item = state.items[key];
          if (!item) return state;
          const q = item.quantity - 1;
          if (q < item.minQty) {
            const next = { ...state.items };
            delete next[key];
            return { items: next };
          }
          return { items: { ...state.items, [key]: { ...item, quantity: q } } };
        }),

      removeLine: (key) =>
        set((state) => {
          const next = { ...state.items };
          delete next[key];
          return { items: next };
        }),

      clear: () => set({ items: {} }),

      clearMode: (mode) =>
        set((state) => {
          const keep: Record<string, CartLine> = {};
          for (const [k, v] of Object.entries(state.items)) {
            const isWholesale = v.variant.startsWith("WHOLESALE");
            if (mode === "WHOLESALE" ? !isWholesale : isWholesale) keep[k] = v;
          }
          return { items: keep };
        }),
    }),
    { name: "gtc-cart-v3" }
  )
);

// ---------- Helpers (compute in render from the stable `items` object) ----------
export function linesForMode(items: Record<string, CartLine>, mode: CartMode): CartLine[] {
  const wholesale = mode === "WHOLESALE";
  return Object.values(items).filter((l) =>
    wholesale ? l.variant.startsWith("WHOLESALE") : l.variant === "RETAIL"
  );
}

export function modeCount(items: Record<string, CartLine>, mode: CartMode): number {
  // distinct lines for the mode (mixing kg + sacks makes summed quantity meaningless)
  return linesForMode(items, mode).length;
}

export function modeTotal(items: Record<string, CartLine>, mode: CartMode): number {
  return linesForMode(items, mode).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
