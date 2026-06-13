import { CustomerType, DeliveryArea } from "@prisma/client";
import { DELIVERY_AREA_LABELS, UNIT_LABELS } from "@/lib/constants";

export interface WhatsAppItem {
  productName: string;
  unit: keyof typeof UNIT_LABELS;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Section divider used in WhatsApp messages.
const DIVIDER = "━━━━━━━━━━━━━━━━━━━━";

/** ₹ amount: no decimals for whole numbers, 2 decimals otherwise. */
function rupee(n: number): string {
  return n % 1 === 0
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface TableRow {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * Builds a monospaced (```) products table with aligned Qty / Rate / Amount
 * columns and a right-aligned grand total. WhatsApp renders text inside ``` in
 * a fixed-width font, so the padded columns line up on every device.
 */
function productTable(items: TableRow[], grandTotal: number): string {
  const money = (n: number) => `₹${rupee(n)}`;
  const qty = items.map((it) => String(it.quantity));
  const rate = items.map((it) => money(it.unitPrice));
  const amt = items.map((it) => money(it.lineTotal));

  const qtyW = Math.max(1, ...qty.map((s) => s.length));
  const rateW = Math.max(1, ...rate.map((s) => s.length));
  const amtW = Math.max(money(grandTotal).length, ...amt.map((s) => s.length));
  const leftW = 3 + qtyW + 3 + rateW; // "   " + qty + " x " + rate

  const rows: string[] = [];
  items.forEach((it, i) => {
    rows.push(`${i + 1}. ${it.productName}`);
    rows.push(`   ${qty[i].padStart(qtyW)} x ${rate[i].padStart(rateW)} = ${amt[i].padStart(amtW)}`);
  });
  rows.push("─".repeat(leftW + 3 + amtW));
  rows.push(`${"GRAND TOTAL".padEnd(leftW)} = ${money(grandTotal).padStart(amtW)}`);

  return "```\n" + rows.join("\n") + "\n```";
}

export interface WhatsAppOrder {
  enquiryCode: string;
  type: CustomerType;
  customerName: string;
  mobile: string;
  shopName?: string | null;
  deliveryArea?: DeliveryArea | null;
  deliveryAddress?: string | null;
  items: WhatsAppItem[];
  grandTotal: number;
}

/**
 * Builds the pre-filled WhatsApp message text exactly matching the formats
 * defined in the business spec (wholesale shows line totals, retail shows
 * delivery area). Returns plain text (not yet URL-encoded).
 */
export function buildWhatsAppMessage(order: WhatsAppOrder): string {
  const L: string[] = [];

  L.push("*Ganesh Trading Company*");
  L.push(DIVIDER);
  L.push(order.type === "WHOLESALE" ? "*Wholesale Order*" : "*Retail Order*");
  L.push(`*Order ID:* ${order.enquiryCode}`);
  L.push(DIVIDER);

  // Customer section
  L.push(`*Customer Name:* ${order.customerName}`);
  L.push(`*Mobile:* ${order.mobile}`);
  if (order.shopName) L.push(`*Shop Name:* ${order.shopName}`);
  if (order.deliveryAddress) {
    L.push(`*Delivery Address:* ${order.deliveryAddress}`);
  } else if (order.deliveryArea) {
    L.push(`*Delivery Area:* ${DELIVERY_AREA_LABELS[order.deliveryArea]}`);
  }
  L.push(DIVIDER);

  // Products — aligned Qty x Rate = Amount table with grand total
  L.push("*Products* (Qty x Rate = Amount)");
  L.push("");
  L.push(productTable(order.items, order.grandTotal));
  L.push("");
  L.push(DIVIDER);

  return L.join("\n");
}

export interface InvoiceMessageInput {
  businessName: string;
  enquiryCode: string;
  customerName: string;
  items: { productName: string; quantity: number; unit: string; unitPrice: number; lineTotal: number }[];
  grandTotal: number;
}

/**
 * Builds a text invoice the shop sends TO the customer on WhatsApp (with the
 * final/updated items). Returns plain text (not URL-encoded).
 */
export function buildInvoiceMessage(input: InvoiceMessageInput): string {
  const L: string[] = [];
  L.push(`*${input.businessName}*`);
  L.push(DIVIDER);
  L.push("*Invoice*");
  L.push(`*Invoice No:* ${input.enquiryCode}`);
  L.push(`*Customer:* ${input.customerName}`);
  L.push(DIVIDER);
  L.push("*Products* (Qty x Rate = Amount)");
  L.push("");
  L.push(productTable(input.items, input.grandTotal));
  L.push("");
  L.push(DIVIDER);
  return L.join("\n");
}

/** Normalises a stored 10-digit mobile to a wa.me number (adds 91 if needed). */
export function toWaNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/** Builds the full wa.me deep link with the message URL-encoded. */
export function buildWhatsAppUrl(order: WhatsAppOrder, whatsappNumber: string): string {
  const text = encodeURIComponent(buildWhatsAppMessage(order));
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
