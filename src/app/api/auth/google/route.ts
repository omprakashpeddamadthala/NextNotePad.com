import { NextResponse } from "next/server";
import { buildGoogleAuthUrl, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/google";

export async function GET() {
  try {
    const state = crypto.randomUUID();

    let authUrl: string;
    try {
      authUrl = buildGoogleAuthUrl(state);
    } catch (err) {
      console.error("[api/auth/google] buildGoogleAuthUrl error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Google OAuth is not configured." },
        { status: 500 },
      );
    }

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (outerErr) {
    console.error("[api/auth/google] Unhandled error:", outerErr);
    return NextResponse.json(
      { error: outerErr instanceof Error ? outerErr.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
