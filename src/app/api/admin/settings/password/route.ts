import "server-only";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return fail("Both current and new password are required", 400);
    }
    if (newPassword.length < 8) {
      return fail("New password must be at least 8 characters", 400);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
    if (!user) return fail("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return fail("Current password is incorrect", 400);

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    return ok({ message: "Password changed successfully" });
  } catch (error) {
    return handleError(error);
  }
}
