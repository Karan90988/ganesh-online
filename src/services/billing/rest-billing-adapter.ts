import { BillingAdapter, ExternalProduct, StockLevel } from "./billing-adapter";

/**
 * Example REST adapter — a TEMPLATE for future integration.
 *
 * When the billing software exposes an HTTP API, set these env vars and
 * register this adapter in ./index.ts:
 *   BILLING_API_URL=https://billing.example.com/api
 *   BILLING_API_KEY=xxxxx
 *
 * Map the vendor's response shape to ExternalProduct / StockLevel below.
 * No other part of the application needs to change.
 */
export class RestBillingAdapter implements BillingAdapter {
  readonly name = "BILLING_SOFTWARE";

  private get baseUrl() {
    return process.env.BILLING_API_URL ?? "";
  }
  private get apiKey() {
    return process.env.BILLING_API_KEY ?? "";
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.apiKey);
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Billing API error ${res.status}`);
    return (await res.json()) as T;
  }

  async fetchProducts(): Promise<ExternalProduct[]> {
    // TODO: map vendor fields to ExternalProduct shape
    const raw = await this.request<any[]>("/products");
    return raw.map((r) => ({
      externalRef: String(r.id),
      name: r.name,
      sku: r.sku,
      category: r.category,
      mrp: Number(r.mrp ?? 0),
      wholesalePrice: r.wholesale_price != null ? Number(r.wholesale_price) : undefined,
      retailPrice: r.retail_price != null ? Number(r.retail_price) : undefined,
      stockQuantity: r.stock != null ? Number(r.stock) : undefined,
      unit: r.unit,
    }));
  }

  async fetchStockLevels(): Promise<StockLevel[]> {
    const raw = await this.request<any[]>("/stock");
    return raw.map((r) => ({
      externalRef: String(r.id),
      sku: r.sku,
      stockQuantity: Number(r.stock ?? 0),
    }));
  }

  async pushStockUpdate(sku: string, stockQuantity: number): Promise<void> {
    await fetch(`${this.baseUrl}/stock/${encodeURIComponent(sku)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stock: stockQuantity }),
    });
  }
}
