import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isUserLocked, updateLockSettings } from "@/lib/lock/lockService";
import { sanitizeLockOptions } from "@/lib/lock/lockPolicy";
import { lockServerError } from "@/lib/lock/lockHttp";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { readJsonBody } from "@/lib/api/requestBody";

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please sign in first");

    const lockStatus = await isUserLocked(user, await cookies());
    if (lockStatus.isLocked) {
      return NextResponse.json(
        {
          error: "Application is locked. Unlock required to change settings.",
          locked: true,
        },
        { status: 423 },
      );
    }

    const body = await readJsonBody<{
      policy: unknown;
      pwaOnResume: unknown;
      autoTimeoutMinutes: unknown;
    }>(request);
    if (!body) return badRequest("Invalid JSON body");

    await updateLockSettings(user.id, sanitizeLockOptions(body));

    return NextResponse.json({
      success: true,
      message: "Lock settings updated",
    });
  } catch (err) {
    return lockServerError("settings", err, "Failed to update lock settings");
  }
}
