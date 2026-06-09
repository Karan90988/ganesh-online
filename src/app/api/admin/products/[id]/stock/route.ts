import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { stockUpdateSchema } from "@/lib/validations";
import { adjustStock } from "@/services/inventory-sync.service";
import { revalidateProducts } from "@/lib/revalidate";
import { ok, handleError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Inventory update: set stock and optionally force a status. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { stockQuantity, status } = stockUpdateSchema.parse(body);
    await adjustStock(id, stockQuantity, status);
    revalidateProducts();
    return ok({ updated: true });
  } catch (error) {
    return handleError(error);
  }
}
