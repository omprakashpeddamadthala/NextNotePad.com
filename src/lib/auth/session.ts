import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./jwt";

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    // Re-checked on every call (this isn't cached anywhere), so a block takes effect on the
    // blocked user's very next request — no re-login or token expiry needed.
    if (!user || user.blocked) return null;

    return user;
  } catch (err) {
    console.error("[getSessionUser] Error resolving session user:", err);
    return null;
  }
}
