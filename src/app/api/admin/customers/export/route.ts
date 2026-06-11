import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";

/** Export all customers as a CSV download. */
export async function GET() {
  try {
    await requireAdmin();
    const customers = await prisma.customer.findMany({
      include: { _count: { select: { enquiries: true } } },
      orderBy: { createdAt: "desc" },
    });

    const header = ["Name", "Mobile", "Shop Name", "Type", "Total Orders", "Joined"];
    const rows = customers.map((c) => [
      c.name,
      c.mobile,
      c.shopName ?? "",
      CUSTOMER_TYPE_LABELS[c.type],
      String(c._count.enquiries),
      c.createdAt.toISOString().slice(0, 10),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
