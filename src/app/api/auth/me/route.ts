import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admin";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      );
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: Boolean(user.isAdmin || isBootstrapAdmin(user.email)),
    };

    const response = NextResponse.json({
      authenticated: true,
      user: authUser,
      ...authUser,
    });

    // Rolling session: renew session cookie for 1 year so user stays permanently logged in
    try {
      const sessionToken = await signSessionToken({ userId: user.id });
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      });
    } catch {
      // Non-fatal
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
