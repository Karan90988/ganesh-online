import "server-only";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBillingAdapter } from "./billing";

export interface SyncResult {
  source: string;
  configured: boolean;
  matched: number;
  updated: number;
  notFound: number;
}

/**
 * Inventory Sync Service
 * ----------------------
 * Pulls stock levels from the active billing adapter and reflects them in the
 * local catalogue. Safe to call on a schedule (cron) or on-demand from admin.
 * When no billing software is configured this is a no-op (returns configured:
 * false) so it never breaks Version 1.
 */
export async function syncInventoryFromBilling(): Promise<SyncResult> {
  const adapter = getBillingAdapter();
  const result: SyncResult = {
    source: adapter.name,
    configured: adapter.isConfigured(),
    matched: 0,
    updated: 0,
    notFound: 0,
  };

  if (!adapter.isConfigured()) {
    return result;
  }

  const levels = await adapter.fetchStockLevels();

  for (const level of levels) {
    // Match by externalRef first, then by SKU.
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ externalRef: level.externalRef }, { sku: level.sku }],
      },
    });

    if (!product) {
      result.notFound++;
      continue;
    }
    result.matched++;

    const status =
      level.stockQuantity <= 0 && product.status === ProductStatus.ACTIVE
        ? ProductStatus.OUT_OF_STOCK
        : level.stockQuantity > 0 && product.status === ProductStatus.OUT_OF_STOCK
        ? ProductStatus.ACTIVE
        : product.status;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: level.stockQuantity,
        status,
        externalRef: product.externalRef ?? level.externalRef,
      },
    });
    result.updated++;
  }

  return result;
}

/** Adjust local stock manually and auto-flip OUT_OF_STOCK / ACTIVE status. */
export async function adjustStock(
  productId: string,
  stockQuantity: number,
  explicitStatus?: ProductStatus
): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  let status = explicitStatus ?? product.status;
  if (!explicitStatus) {
    if (stockQuantity <= 0 && product.status === ProductStatus.ACTIVE) {
      status = ProductStatus.OUT_OF_STOCK;
    } else if (stockQuantity > 0 && product.status === ProductStatus.OUT_OF_STOCK) {
      status = ProductStatus.ACTIVE;
    }
  }

  await prisma.product.update({
    where: { id: productId },
    data: { stockQuantity, status },
  });
}
