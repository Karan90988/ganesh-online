import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartMode } from "../lib/types";
import { CartLineInput } from "../lib/cart-lines";

export interface CartLine extends CartLineInput {
  quantity: number;
}

interface CartState {
  mode: CartMode;
  setMode: (m: CartMode) => void;
  items: Record<string, CartLine>;
  addLine: (line: CartLineInput, qty?: number) => void;
  setQuantity: (key: string, qty: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeLine: (key: string) => void;
  clearMode: (mode: CartMode) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      mode: "RETAIL",
      setMode: (m) => set({ mode: m }),
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
    { name: "gtc-cart", storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ---- helpers ----
export function linesForMode(items: Record<string, CartLine>, mode: CartMode): CartLine[] {
  const wholesale = mode === "WHOLESALE";
  return Object.values(items).filter((l) =>
    wholesale ? l.variant.startsWith("WHOLESALE") : l.variant === "RETAIL"
  );
}

export function modeCount(items: Record<string, CartLine>, mode: CartMode): number {
  return linesForMode(items, mode).length;
}

export function modeTotal(items: Record<string, CartLine>, mode: CartMode): number {
  return linesForMode(items, mode).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
