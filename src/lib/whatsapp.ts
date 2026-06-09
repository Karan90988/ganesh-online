import { CustomerType, DeliveryArea } from "@prisma/client";
import { DELIVERY_AREA_LABELS, UNIT_LABELS } from "@/lib/constants";

export interface WhatsAppItem {
  productName: string;
  unit: keyof typeof UNIT_LABELS;
  quantity: number;
  lineTotal: number;
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
  const lines: string[] = [];
  lines.push("Hello Ganesh Trading Company,");
  lines.push("");

  if (order.type === "WHOLESALE") {
    lines.push("Wholesale Order Enquiry");
    lines.push("");
    lines.push(`Enquiry ID: ${order.enquiryCode}`);
    lines.push("");
    lines.push(`Customer Name: ${order.customerName}`);
    lines.push(`Mobile: ${order.mobile}`);
    if (order.shopName) lines.push(`Shop Name: ${order.shopName}`);
    lines.push("");
    lines.push("Products:");
    order.items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.productName} x ${it.quantity} = ₹${formatNum(it.lineTotal)}`);
    });
  } else {
    lines.push("Retail Order Enquiry");
    lines.push("");
    lines.push(`Enquiry ID: ${order.enquiryCode}`);
    lines.push("");
    lines.push(`Customer Name: ${order.customerName}`);
    lines.push(`Mobile: ${order.mobile}`);
    lines.push("");
    if (order.deliveryAddress) {
      lines.push(`Delivery Address: ${order.deliveryAddress}`);
      lines.push("");
    } else if (order.deliveryArea) {
      lines.push(`Delivery Area: ${DELIVERY_AREA_LABELS[order.deliveryArea]}`);
      lines.push("");
    }
    lines.push("Products:");
    order.items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.productName} x ${it.quantity}`);
    });
  }

  lines.push("");
  lines.push(`Grand Total: ₹${formatNum(order.grandTotal)}`);
  lines.push("");
  lines.push("Please contact me regarding delivery.");
  lines.push("");
  lines.push("Thank You.");

  return lines.join("\n");
}

function formatNum(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export interface InvoiceMessageInput {
  businessName: string;
  enquiryCode: string;
  customerName: string;
  items: { productName: string; quantity: number; unit: string; lineTotal: number }[];
  grandTotal: number;
}

/**
 * Builds a text invoice the shop sends TO the customer on WhatsApp (with the
 * final/updated items). Returns plain text (not URL-encoded).
 */
export function buildInvoiceMessage(input: InvoiceMessageInput): string {
  const lines: string[] = [];
  lines.push(`Hello ${input.customerName},`);
  lines.push(`Here is your invoice from ${input.businessName}.`);
  lines.push("");
  lines.push(`Invoice No: ${input.enquiryCode}`);
  lines.push("");
  input.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.productName} x ${it.quantity} = ₹${formatNum(it.lineTotal)}`);
  });
  lines.push("");
  lines.push(`Grand Total: ₹${formatNum(input.grandTotal)}`);
  lines.push("");
  lines.push("Thank you for shopping with us!");
  return lines.join("\n");
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
