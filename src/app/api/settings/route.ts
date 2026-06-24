import { getSettings } from "@/lib/settings";
import { ok, handleError } from "@/lib/api";

/** Public store settings (delivery thresholds + minimum order) for checkout. */
export async function GET() {
  try {
    return ok(await getSettings());
  } catch (error) {
    return handleError(error);
  }
}
