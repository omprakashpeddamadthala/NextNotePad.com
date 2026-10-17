import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { setupUserLock } from "@/lib/lock/lockService";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return unauthorized("Please sign in first");
    }

    let body: {
      password?: unknown;
      policy?: unknown;
      pwaOnResume?: unknown;
      autoTimeoutMinutes?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { password, policy, pwaOnResume, autoTimeoutMinutes } = body;

    if (typeof password !== "string" || password.length === 0) {
      return badRequest("Lock password is required");
    }

    const validPolicies = ["next_visit", "new_day", "immediate"];
    const sanitizedPolicy =
      typeof policy === "string" && validPolicies.includes(policy)
        ? policy
        : "next_visit";

    const sanitizedPwaOnResume =
      typeof pwaOnResume === "boolean" ? pwaOnResume : true;

    const sanitizedAutoTimeout =
      typeof autoTimeoutMinutes === "number" &&
      autoTimeoutMinutes >= 0 &&
      autoTimeoutMinutes <= 1440
        ? Math.floor(autoTimeoutMinutes)
        : 0;

    const result = await setupUserLock(user.id, password, {
      policy: sanitizedPolicy,
      pwaOnResume: sanitizedPwaOnResume,
      autoTimeoutMinutes: sanitizedAutoTimeout,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password lock configured successfully",
    });

    const isSessionOnly = sanitizedPolicy === "next_visit";

    response.cookies.set(UNLOCK_COOKIE_NAME, result.unlockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(isSessionOnly ? {} : { maxAge: 60 * 60 * 24 * 7 }),
    });

    return response;
  } catch (err) {
    console.error("[api/lock/setup] Error setting up lock:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to configure password lock",
      },
      { status: 500 },
    );
  }
}
