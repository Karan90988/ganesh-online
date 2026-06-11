import "server-only";
import { randomUUID } from "crypto";
import { CustomerType, Prisma, Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CheckoutInput } from "@/lib/validations";
import { UNIT_LABELS, MIN_ORDER_VALUE } from "@/lib/constants";

export interface CreatedEnquiry {
  id: string;
  enquiryCode: string;
  type: CustomerType;
  customerName: string;
  mobile: string;
  shopName: string | null;
  deliveryArea: string | null;
  deliveryAddress: string | null;
  grandTotal: number;
  items: {
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

/**
 * Creates an enquiry from validated checkout input.
 *
 * IMPORTANT: Prices and product names are always re-read from the database —
 * never trusted from the client — and the correct price (wholesale vs retail)
 * is chosen by enquiry type. The enquiry + items + customer are persisted in a
 * single transaction BEFORE any WhatsApp redirect, so the shop owner always
 * receives the lead even if the customer never sends the WhatsApp message.
 */
export async function createEnquiry(input: CheckoutInput): Promise<CreatedEnquiry> {
  // Load authoritative product data
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lineItems = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    let unitPrice: number;
    let unitEnum: Unit;
    let productName: string;

    const baseUnit = UNIT_LABELS[product.unit];

    if (input.type === "RETAIL") {
      unitPrice = Number(product.retailPrice);
      unitEnum = product.unit;
      productName = product.name;
    } else if (item.variant === "WHOLESALE_PACK1" || item.variant === "WHOLESALE_PACK2") {
      // Pack tier (e.g. Outer / Box / Sack)
      const isPack2 = item.variant === "WHOLESALE_PACK2";
      const label = isPack2 ? product.pack2Label : product.pack1Label;
      const size = isPack2 ? product.pack2Size : product.pack1Size;
      const price = isPack2 ? product.pack2Price : product.pack1Price;
      if (!product.hasBulkPricing || !label || !size || price == null) {
        throw new Error(`${product.name} is not available as a "${isPack2 ? "box" : "pack"}"`);
      }
      unitPrice = Number(price);
      unitEnum = product.unit;
      productName = `${product.name} (${label} ${size} ${baseUnit})`;
    } else {
      // Wholesale loose (per base unit)
      if (product.hasBulkPricing && !product.wholesaleLooseEnabled) {
        throw new Error(`${product.name} can only be ordered by pack in wholesale`);
      }
      const minQty = Math.max(1, product.wholesaleMinQty || 1);
      if (item.quantity < minQty) {
        throw new Error(
          `Minimum wholesale order for ${product.name} is ${minQty} ${baseUnit}`
        );
      }
      unitPrice = Number(product.wholesalePrice);
      unitEnum = product.unit;
      productName = product.hasBulkPricing ? `${product.name} (Loose)` : product.name;
    }

    const lineTotal = unitPrice * item.quantity;
    return {
      productId: product.id,
      productName,
      unit: unitEnum,
      unitPrice: new Prisma.Decimal(unitPrice),
      quantity: item.quantity,
      lineTotal: new Prisma.Decimal(lineTotal),
    };
  });

  const grandTotal = lineItems.reduce((sum, it) => sum + Number(it.lineTotal), 0);

  // Enforce minimum order value (retail vs wholesale)
  const minValue = MIN_ORDER_VALUE[input.type];
  if (grandTotal < minValue) {
    throw new Error(
      `Minimum ${input.type === "WHOLESALE" ? "wholesale" : "retail"} order is ₹${minValue}. Please add more items.`
    );
  }

  const enquiry = await prisma.$transaction(async (tx) => {
    // Upsert customer keyed by mobile number
    const customer = await tx.customer.upsert({
      where: { mobile: input.mobile },
      update: {
        name: input.customerName,
        shopName: input.shopName || undefined,
        // Promote to wholesale if they ever place a wholesale order
        type: input.type === "WHOLESALE" ? CustomerType.WHOLESALE : undefined,
      },
      create: {
        name: input.customerName,
        mobile: input.mobile,
        shopName: input.shopName || null,
        type: input.type,
      },
    });

    const created = await tx.enquiry.create({
      data: {
        enquiryCode: `TEMP-${randomUUID()}`,
        type: input.type,
        customerName: input.customerName,
        mobile: input.mobile,
        shopName: input.type === "WHOLESALE" ? input.shopName || null : null,
        deliveryArea: input.type === "RETAIL" ? input.deliveryArea ?? null : null,
        deliveryAddress: input.type === "RETAIL" ? input.deliveryAddress || null : null,
        grandTotal: new Prisma.Decimal(grandTotal),
        customerId: customer.id,
        items: { create: lineItems },
      },
    });

    const enquiryCode = `GTC-${String(created.sequence).padStart(6, "0")}`;

    return tx.enquiry.update({
      where: { id: created.id },
      data: { enquiryCode },
      include: { items: true },
    });
  });

  return {
    id: enquiry.id,
    enquiryCode: enquiry.enquiryCode,
    type: enquiry.type,
    customerName: enquiry.customerName,
    mobile: enquiry.mobile,
    shopName: enquiry.shopName,
    deliveryArea: enquiry.deliveryArea,
    deliveryAddress: enquiry.deliveryAddress,
    grandTotal: Number(enquiry.grandTotal),
    items: enquiry.items.map((it) => ({
      productName: it.productName,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    })),
  };
}

export async function markWhatsAppSent(enquiryId: string): Promise<void> {
  await prisma.enquiry
    .update({ where: { id: enquiryId }, data: { whatsappSent: true } })
    .catch(() => {});
}
