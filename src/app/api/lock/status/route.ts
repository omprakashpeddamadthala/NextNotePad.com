import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isUserLocked, getUserLockRecord } from "@/lib/lock/lockService";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        enabled: false,
        isLocked: false,
      });
    }

    const [record, cookieStore] = await Promise.all([
      getUserLockRecord(user.id),
      cookies(),
    ]);
    const lockStatus = await isUserLocked(user, cookieStore);

    return NextResponse.json({
      authenticated: true,
      enabled: record?.lockEnabled ?? false,
      isLocked: lockStatus.isLocked,
      policy: record?.lockPolicy || "next_visit",
      pwaOnResume: record?.pwaOnResume ?? true,
      autoTimeoutMinutes: record?.autoTimeoutMinutes ?? 0,
    });
  } catch (err) {
    console.error("[api/lock/status] Error checking lock status:", err);
    return NextResponse.json(
      { authenticated: false, enabled: false, isLocked: false },
      { status: 500 },
    );
  }
}
