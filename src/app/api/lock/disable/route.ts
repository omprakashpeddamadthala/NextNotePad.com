import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { disableUserLock } from "@/lib/lock/lockService";
import { UNLOCK_COOKIE_NAME } from "@/lib/lock/lockTokens";
import { lockFailure, lockServerError } from "@/lib/lock/lockHttp";
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
      return badRequest("Lock password is required to disable lock");
    }

    const result = await disableUserLock(user.id, password);
    if (!result.success) {
      return lockFailure(result.error || "Failed to disable lock");
    }

    const response = NextResponse.json({
      success: true,
      message: "Password lock disabled",
    });
    response.cookies.delete(UNLOCK_COOKIE_NAME);
    return response;
  } catch (err) {
    return lockServerError("disable", err, "Failed to disable lock");
  }
}
