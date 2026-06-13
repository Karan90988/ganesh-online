import { API_BASE_URL } from "./config";

/** GET a JSON endpoint. The backend wraps responses as { success, data }. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

/** POST JSON to an endpoint. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

/** Simple ₹ formatter (avoids Intl issues on some RN engines). */
export function formatCurrency(value: number): string {
  const n = Number(value) || 0;
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(2);
  // Indian grouping (1,23,456)
  const [intPart, decPart] = fixed.split(".");
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `₹${grouped}${decPart ? "." + decPart : ""}`;
}
