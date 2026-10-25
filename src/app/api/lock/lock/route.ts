import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";
import { lockServerError } from "@/lib/lock/lockHttp";
import { unauthorized } from "@/lib/api/respond";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please sign in first");

    const response = NextResponse.json({
      success: true,
      locked: true,
      message: "Application locked",
    });
    response.cookies.delete(UNLOCK_COOKIE_NAME);
    return response;
  } catch (err) {
    return lockServerError("lock", err, "Failed to lock application");
  }
}
