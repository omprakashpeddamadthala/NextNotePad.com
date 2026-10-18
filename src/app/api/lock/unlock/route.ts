import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admin";
import { verifyAndUnlock } from "@/lib/lock/lockService";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return unauthorized("Please sign in first");
    }

    let body: { password?: unknown };
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { password } = body;
    if (typeof password !== "string" || password.length === 0) {
      return badRequest("Lock password is required");
    }

    const result = await verifyAndUnlock(user.id, password);

    if (!result.success || !result.unlockToken) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Incorrect lock password",
          retryAfterSeconds: result.retryAfterSeconds,
          locked: true,
        },
        { status: result.retryAfterSeconds ? 429 : 401 },
      );
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: Boolean(user.isAdmin || isBootstrapAdmin(user.email)),
    };

    const response = NextResponse.json({
      success: true,
      locked: false,
      user: authUser,
    });

    const isSessionOnly = user.lockPolicy === "next_visit";

    response.cookies.set(UNLOCK_COOKIE_NAME, result.unlockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(isSessionOnly ? {} : { maxAge: 60 * 60 * 24 * 7 }),
    });

    return response;
  } catch (err) {
    console.error("[api/lock/unlock] Error during unlock:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during unlock" },
      { status: 500 },
    );
  }
}
