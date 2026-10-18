import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { changeUserLockPassword } from "@/lib/lock/lockService";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return unauthorized("Please sign in first");
    }

    let body: {
      currentPassword?: unknown;
      newPassword?: unknown;
      policy?: unknown;
      pwaOnResume?: unknown;
      autoTimeoutMinutes?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { currentPassword, newPassword, policy, pwaOnResume, autoTimeoutMinutes } = body;

    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return badRequest("Current lock password is required");
    }

    if (typeof newPassword !== "string" || newPassword.length === 0) {
      return badRequest("New lock password is required");
    }

    const validPolicies = ["next_visit", "new_day", "immediate"];
    const sanitizedPolicy =
      typeof policy === "string" && validPolicies.includes(policy)
        ? policy
        : undefined;

    const sanitizedPwaOnResume =
      typeof pwaOnResume === "boolean" ? pwaOnResume : undefined;

    const sanitizedAutoTimeout =
      typeof autoTimeoutMinutes === "number" &&
      autoTimeoutMinutes >= 0 &&
      autoTimeoutMinutes <= 1440
        ? Math.floor(autoTimeoutMinutes)
        : undefined;

    const result = await changeUserLockPassword(
      user.id,
      currentPassword,
      newPassword,
      {
        policy: sanitizedPolicy,
        pwaOnResume: sanitizedPwaOnResume,
        autoTimeoutMinutes: sanitizedAutoTimeout,
      },
    );

    if (!result.success || !result.unlockToken) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to change lock password" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Lock password changed successfully",
    });

    const isSessionOnly = (sanitizedPolicy || user.lockPolicy) === "next_visit";

    response.cookies.set(UNLOCK_COOKIE_NAME, result.unlockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(isSessionOnly ? {} : { maxAge: 60 * 60 * 24 * 7 }),
    });

    return response;
  } catch (err) {
    console.error("[api/lock/change] Error changing lock password:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to change lock password",
      },
      { status: 500 },
    );
  }
}
