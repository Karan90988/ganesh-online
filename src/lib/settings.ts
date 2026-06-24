import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { CustomerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface StoreSettings {
  /** Retail cart subtotal ≥ this ⇒ free delivery. */
  retailFreeDeliveryThreshold: number;
  /** Delivery fee added when a retail cart is below the threshold. */
  retailDeliveryCharge: number;
  /** Minimum wholesale cart value required to place an order. */
  wholesaleMinOrderValue: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  retailFreeDeliveryThreshold: 500,
  retailDeliveryCharge: 40,
  wholesaleMinOrderValue: 1499,
};

const SETTINGS_TAG = "settings";

/** Reads the single settings row (id = 1), falling back to defaults. */
export const getSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const row = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!row) return DEFAULT_SETTINGS;
    return {
      retailFreeDeliveryThreshold: row.retailFreeDeliveryThreshold,
      retailDeliveryCharge: row.retailDeliveryCharge,
      wholesaleMinOrderValue: row.wholesaleMinOrderValue,
    };
  },
  ["store-settings"],
  { tags: [SETTINGS_TAG], revalidate: 300 }
);

/** Call after writing settings so reads refresh immediately. */
export function revalidateSettings() {
  revalidateTag(SETTINGS_TAG);
}

/**
 * Delivery charge for a retail order: free at/above the threshold, otherwise the
 * fixed charge. Wholesale never has a delivery charge.
 */
export function deliveryChargeFor(
  type: CustomerType,
  subtotal: number,
  s: StoreSettings
): number {
  if (type !== "RETAIL") return 0;
  return subtotal >= s.retailFreeDeliveryThreshold ? 0 : s.retailDeliveryCharge;
}
