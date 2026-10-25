import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { verifyAndUnlock } from "@/lib/lock/lockService";
import {
  lockServerError,
  setUnlockCookie,
  toAuthUser,
} from "@/lib/lock/lockHttp";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { readJsonBody } from "@/lib/api/requestBody";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please sign in first");

    const body = await readJsonBody<{ password: unknown }>(request);
    if (!body) return badRequest("Invalid JSON body");

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

    const response = NextResponse.json({
      success: true,
      locked: false,
      user: toAuthUser(user),
    });
    setUnlockCookie(response, result.unlockToken, user.lockPolicy);
    return response;
  } catch (err) {
    return lockServerError(
      "unlock",
      err,
      "An unexpected error occurred during unlock",
    );
  }
}
