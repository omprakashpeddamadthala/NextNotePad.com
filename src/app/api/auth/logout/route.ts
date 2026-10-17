import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(UNLOCK_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
