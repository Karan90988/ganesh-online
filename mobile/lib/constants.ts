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
export const WHATSAPP_GREEN = "#25D366";
