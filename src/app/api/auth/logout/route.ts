import { destroySession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function POST() {
  try {
    await destroySession();
    return ok({ loggedOut: true });
  } catch (error) {
    return handleError(error);
  }
}
