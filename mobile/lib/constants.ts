import { CartMode, Unit } from "./types";

export const UNIT_LABELS: Record<Unit, string> = {
  PIECE: "Piece",
  KG: "Kg",
  LITRE: "Litre",
  PACKET: "Packet",
  BOX: "Box",
  SACK: "Sack",
};

/** Minimum order value (grand total, ₹) required to place an order. */
export const MIN_ORDER_VALUE: Record<CartMode, number> = {
  RETAIL: 109,
  WHOLESALE: 1499,
};

export const GREEN = "#16a34a";
export const GREEN_DARK = "#15803d";
export const GREEN_LIGHT = "#f0fdf4";
// Saffron palette used when the customer is in Wholesale mode.
export const SAFFRON = "#ea7c0c";
export const SAFFRON_DARK = "#c2620a";
export const SAFFRON_LIGHT = "#fff7ed";
export const WHATSAPP_GREEN = "#25D366";

/** Brand chrome colour for a shopping mode (header / tab bar / accents). */
export function modeTheme(mode: "RETAIL" | "WHOLESALE") {
  return mode === "WHOLESALE"
    ? { main: SAFFRON, dark: SAFFRON_DARK, light: SAFFRON_LIGHT }
    : { main: GREEN, dark: GREEN_DARK, light: GREEN_LIGHT };
}
