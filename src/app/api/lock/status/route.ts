import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isUserLocked, getUserLockRecord } from "@/lib/lock/lockService";
import { toLockInfo } from "@/lib/lock/lockHttp";

const SIGNED_OUT = { authenticated: false, enabled: false, isLocked: false };

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json(SIGNED_OUT);

    const [record, cookieStore] = await Promise.all([
      getUserLockRecord(user.id),
      cookies(),
    ]);
    const lockStatus = await isUserLocked(user, cookieStore, record);

    return NextResponse.json({
      authenticated: true,
      ...toLockInfo(record, lockStatus.isLocked),
    });
  } catch (err) {
    console.error("[api/lock/status] Error checking lock status:", err);
    return NextResponse.json(SIGNED_OUT, { status: 500 });
  }
}
