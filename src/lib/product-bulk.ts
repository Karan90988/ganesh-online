import { ProductInput } from "@/lib/validations";

/**
 * Normalises the wholesale pack/bulk fields from validated product input into
 * the exact shape Prisma expects. When bulk pricing is off, everything is
 * cleared; pack tier 2 is only kept when fully provided. Shared by the create
 * and update product API routes.
 */
export function bulkFields(data: ProductInput) {
  if (!data.hasBulkPricing) {
    return {
      hasBulkPricing: false,
      wholesaleLooseEnabled: true,
      wholesaleMinQty: data.wholesaleMinQty ?? 1,
      pack1Label: null,
      pack1Size: null,
      pack1Price: null,
      pack2Label: null,
      pack2Size: null,
      pack2Price: null,
    };
  }

  const hasPack2 = !!data.pack2Label && data.pack2Size != null && data.pack2Price != null;

  return {
    hasBulkPricing: true,
    wholesaleLooseEnabled: data.wholesaleLooseEnabled,
    wholesaleMinQty: data.wholesaleMinQty ?? 1,
    pack1Label: data.pack1Label || null,
    pack1Size: data.pack1Size ?? null,
    pack1Price: data.pack1Price ?? null,
    pack2Label: hasPack2 ? data.pack2Label || null : null,
    pack2Size: hasPack2 ? data.pack2Size ?? null : null,
    pack2Price: hasPack2 ? data.pack2Price ?? null : null,
  };
}
