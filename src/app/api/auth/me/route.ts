import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/jwt";
import { isUserLocked, getUserLockRecord } from "@/lib/lock/lockService";
import { toAuthUser, toLockInfo } from "@/lib/lock/lockHttp";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, locked: false },
        { status: 200 },
      );
    }

    const [record, cookieStore] = await Promise.all([
      getUserLockRecord(user.id),
      cookies(),
    ]);

    const lockStatus = await isUserLocked(user, cookieStore, record);
    const lockInfo = toLockInfo(record, lockStatus.isLocked);

    // When the application is locked, do NOT return any sensitive user details
    // (email, name, avatar, etc.) to the client.
    if (lockStatus.isLocked) {
      return NextResponse.json({
        authenticated: true,
        locked: true,
        lock: lockInfo,
        user: null,
      });
    }

    const authUser = toAuthUser(user);

    const response = NextResponse.json({
      authenticated: true,
      locked: false,
      lock: lockInfo,
      user: authUser,
      ...authUser,
    });

    try {
      const sessionToken = await signSessionToken({ userId: user.id });
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      });
    } catch (err) {
      // Refreshing the sliding session is best-effort; the current cookie is still valid.
      console.warn("[api/auth/me] Could not refresh session cookie:", err);
    }

    return response;
  } catch (err) {
    console.error("[api/auth/me] Unexpected session error:", err);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 },
    );
  }
}
