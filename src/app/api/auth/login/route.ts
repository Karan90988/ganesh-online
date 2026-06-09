import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyCredentials, createSession } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const user = await verifyCredentials(email, password);
    if (!user) {
      return fail("Invalid email or password", 401);
    }
    await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    return handleError(error);
  }
}
