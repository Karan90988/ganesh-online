import { BillingAdapter } from "./billing-adapter";
import { NoopBillingAdapter } from "./noop-billing-adapter";
import { RestBillingAdapter } from "./rest-billing-adapter";

export * from "./billing-adapter";

/**
 * Factory that selects the active billing adapter.
 *
 * To connect real billing software in the future, set BILLING_API_URL +
 * BILLING_API_KEY and the REST adapter is used automatically; otherwise the
 * Noop adapter keeps everything a safe no-op. This is the ONLY place that
 * decides which adapter is live.
 */
let cached: BillingAdapter | null = null;

export function getBillingAdapter(): BillingAdapter {
  if (cached) return cached;
  const rest = new RestBillingAdapter();
  cached = rest.isConfigured() ? rest : new NoopBillingAdapter();
  return cached;
}
