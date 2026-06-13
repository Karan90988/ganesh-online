import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/api";

/**
 * Export all products as an .xlsx download. The first columns match the Excel
 * IMPORT format (Product Name, Category, MRP, Wholesale Price, Image URL) so the
 * file can be edited and re-uploaded; extra columns are informational.
 */
export async function GET() {
  try {
    await requireAdmin();
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    const rows = products.map((p) => ({
      "Product Name": p.name,
      Category: p.category.name,
      MRP: Number(p.mrp),
      "Wholesale Price": Number(p.wholesalePrice),
      "Image URL": p.imageUrl ?? "",
      "Retail Price": Number(p.retailPrice),
      Stock: p.stockQuantity,
      Unit: p.unit,
      Status: p.status,
      SKU: p.sku,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="products-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
