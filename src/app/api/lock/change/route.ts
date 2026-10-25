import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { changeUserLockPassword } from "@/lib/lock/lockService";
import { sanitizeLockOptions } from "@/lib/lock/lockPolicy";
import {
  lockFailure,
  lockServerError,
  setUnlockCookie,
} from "@/lib/lock/lockHttp";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { readJsonBody } from "@/lib/api/requestBody";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please sign in first");

    const body = await readJsonBody<{
      currentPassword: unknown;
      newPassword: unknown;
      policy: unknown;
      pwaOnResume: unknown;
      autoTimeoutMinutes: unknown;
    }>(request);
    if (!body) return badRequest("Invalid JSON body");

    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return badRequest("Current lock password is required");
    }
    if (typeof newPassword !== "string" || newPassword.length === 0) {
      return badRequest("New lock password is required");
    }

    const options = sanitizeLockOptions(body);
    const result = await changeUserLockPassword(
      user.id,
      currentPassword,
      newPassword,
      options,
    );
    if (!result.success || !result.unlockToken) {
      return lockFailure(result.error || "Failed to change lock password");
    }

    const response = NextResponse.json({
      success: true,
      message: "Lock password changed successfully",
    });
    setUnlockCookie(
      response,
      result.unlockToken,
      options.policy || user.lockPolicy,
    );
    return response;
  } catch (err) {
    return lockServerError("change", err, "Failed to change lock password");
  }
}
