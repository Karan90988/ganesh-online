import { BillingAdapter, ExternalProduct, StockLevel } from "./billing-adapter";

/**
 * Default adapter used in Version 1 — no billing software is connected yet.
 * It reports itself as not configured and returns empty data, so inventory
 * sync becomes a safe no-op until a real adapter is registered.
 */
export class NoopBillingAdapter implements BillingAdapter {
  readonly name = "NOOP";

  isConfigured(): boolean {
    return false;
  }

  async fetchProducts(): Promise<ExternalProduct[]> {
    return [];
  }

  async fetchStockLevels(): Promise<StockLevel[]> {
    return [];
  }
}
