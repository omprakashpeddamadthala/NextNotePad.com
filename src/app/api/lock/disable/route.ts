import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { disableUserLock } from "@/lib/lock/lockService";
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
      return badRequest("Lock password is required to disable lock");
    }

    const result = await disableUserLock(user.id, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to disable lock" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Password lock disabled",
    });

    response.cookies.delete(UNLOCK_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error("[api/lock/disable] Error disabling lock:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to disable lock",
      },
      { status: 500 },
    );
  }
}
