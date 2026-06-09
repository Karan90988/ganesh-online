import { requireAdmin } from "@/lib/auth";
import { syncInventoryFromBilling } from "@/services/inventory-sync.service";
import { revalidateProducts } from "@/lib/revalidate";
import { ok, handleError } from "@/lib/api";

/** Trigger an inventory sync from the configured billing software adapter. */
export async function POST() {
  try {
    await requireAdmin();
    const result = await syncInventoryFromBilling();
    revalidateProducts();
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
