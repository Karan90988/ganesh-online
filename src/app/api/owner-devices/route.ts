import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";

const schema = z.object({
  token: z.string().min(1).max(200),
  secret: z.string().min(1),
  label: z.string().max(60).optional(),
  enable: z.boolean().default(true),
});

/**
 * Registers (or removes) a shop-owner device for new-order push alerts.
 * Secret-gated by OWNER_PUSH_SECRET so customers can't subscribe.
 */
export async function POST(req: NextRequest) {
  try {
    const secretEnv = process.env.OWNER_PUSH_SECRET;
    if (!secretEnv) return fail("Owner alerts are not configured", 503);

    const { token, secret, label, enable } = schema.parse(await req.json());
    if (secret !== secretEnv) return fail("Invalid code", 401);

    if (!enable) {
      await prisma.ownerDevice.deleteMany({ where: { token } });
      return ok({ enabled: false });
    }

    await prisma.ownerDevice.upsert({
      where: { token },
      update: { label: label || undefined },
      create: { token, label: label || null },
    });
    return ok({ enabled: true });
  } catch (error) {
    return handleError(error);
  }
}
