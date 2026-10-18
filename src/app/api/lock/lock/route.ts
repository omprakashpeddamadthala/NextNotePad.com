import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";
import { unauthorized } from "@/lib/api/respond";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return unauthorized("Please sign in first");
    }

    const response = NextResponse.json({
      success: true,
      locked: true,
      message: "Application locked",
    });

    response.cookies.delete(UNLOCK_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error("[api/lock/lock] Error locking application:", err);
    return NextResponse.json(
      { success: false, error: "Failed to lock application" },
      { status: 500 },
    );
  }
}
