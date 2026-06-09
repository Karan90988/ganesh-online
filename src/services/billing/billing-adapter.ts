/**
 * Billing Software Adapter Layer
 * ------------------------------
 * The shop currently uses external billing software. To allow future
 * integration WITHOUT major code changes, all interaction with that software
 * goes through this single interface. Swap in a concrete adapter (REST, CSV
 * export, vendor SDK, etc.) by implementing `BillingAdapter` and registering it
 * in `./index.ts`. The rest of the app only ever depends on this contract.
 */

export interface ExternalProduct {
  externalRef: string; // id in the billing software
  name: string;
  sku: string;
  category?: string;
  mrp: number;
  wholesalePrice?: number;
  retailPrice?: number;
  stockQuantity?: number;
  unit?: string;
}

export interface StockLevel {
  externalRef: string;
  sku: string;
  stockQuantity: number;
}

export interface BillingAdapter {
  /** Stable identifier for logging/import-source tagging. */
  readonly name: string;

  /** True when credentials/config are present and the adapter can be used. */
  isConfigured(): boolean;

  /** Pull the full product catalogue from the billing software. */
  fetchProducts(): Promise<ExternalProduct[]>;

  /** Pull current stock levels (cheaper than full product fetch). */
  fetchStockLevels(): Promise<StockLevel[]>;

  /** Push a local stock change back to the billing software (optional). */
  pushStockUpdate?(sku: string, stockQuantity: number): Promise<void>;
}
