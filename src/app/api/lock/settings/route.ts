import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isUserLocked, updateLockSettings } from "@/lib/lock/lockService";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return unauthorized("Please sign in first");
    }

    const cookieStore = await cookies();
    const lockStatus = await isUserLocked(user, cookieStore);
    if (lockStatus.isLocked) {
      return NextResponse.json(
        { error: "Application is locked. Unlock required to change settings.", locked: true },
        { status: 423 },
      );
    }

    let body: {
      policy?: unknown;
      pwaOnResume?: unknown;
      autoTimeoutMinutes?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { policy, pwaOnResume, autoTimeoutMinutes } = body;

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

    await updateLockSettings(user.id, {
      policy: sanitizedPolicy,
      pwaOnResume: sanitizedPwaOnResume,
      autoTimeoutMinutes: sanitizedAutoTimeout,
    });

    return NextResponse.json({
      success: true,
      message: "Lock settings updated",
    });
  } catch (err) {
    console.error("[api/lock/settings] Error updating settings:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update lock settings" },
      { status: 500 },
    );
  }
}
