import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { importProductsFromBuffer } from "@/services/product-import.service";
import { revalidateProducts, revalidateCategories } from "@/lib/revalidate";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

/** Excel/CSV product import. Expects multipart/form-data with field "file". */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return fail("No file uploaded. Use form field 'file'.", 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const summary = await importProductsFromBuffer(buffer, file.name);
    revalidateProducts();
    revalidateCategories();
    return ok(summary);
  } catch (error) {
    return handleError(error);
  }
}
