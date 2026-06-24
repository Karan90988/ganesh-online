import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";
import { getSettings, revalidateSettings } from "@/lib/settings";
import { ok, handleError } from "@/lib/api";

/** Read current store settings (admin). */
export async function GET() {
  try {
    await requireAdmin();
    return ok(await getSettings());
  } catch (error) {
    return handleError(error);
  }
}

/** Update store settings (admin). Always writes the single row id = 1. */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = settingsSchema.parse(body);
    const row = await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    revalidateSettings();
    return ok({
      retailFreeDeliveryThreshold: row.retailFreeDeliveryThreshold,
      retailDeliveryCharge: row.retailDeliveryCharge,
      wholesaleMinOrderValue: row.wholesaleMinOrderValue,
    });
  } catch (error) {
    return handleError(error);
  }
}
