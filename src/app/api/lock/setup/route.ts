import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { setupUserLock } from "@/lib/lock/lockService";
import {
  DEFAULT_AUTO_TIMEOUT_MINUTES,
  DEFAULT_LOCK_POLICY,
  DEFAULT_PWA_ON_RESUME,
  sanitizeLockOptions,
} from "@/lib/lock/lockPolicy";
import { lockServerError, setUnlockCookie } from "@/lib/lock/lockHttp";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { readJsonBody } from "@/lib/api/requestBody";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please sign in first");

    const body = await readJsonBody<{
      password: unknown;
      policy: unknown;
      pwaOnResume: unknown;
      autoTimeoutMinutes: unknown;
    }>(request);
    if (!body) return badRequest("Invalid JSON body");

    const { password } = body;
    if (typeof password !== "string" || password.length === 0) {
      return badRequest("Lock password is required");
    }

    const options = sanitizeLockOptions(body);
    const policy = options.policy ?? DEFAULT_LOCK_POLICY;
    const result = await setupUserLock(user.id, password, {
      policy,
      pwaOnResume: options.pwaOnResume ?? DEFAULT_PWA_ON_RESUME,
      autoTimeoutMinutes:
        options.autoTimeoutMinutes ?? DEFAULT_AUTO_TIMEOUT_MINUTES,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password lock configured successfully",
    });
    setUnlockCookie(response, result.unlockToken, policy);
    return response;
  } catch (err) {
    return lockServerError("setup", err, "Failed to configure password lock");
  }
}
