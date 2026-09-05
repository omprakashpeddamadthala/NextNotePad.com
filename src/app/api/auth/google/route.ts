import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/google";

export async function GET() {
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  let authUrl: string;
  try {
    authUrl = buildGoogleAuthUrl(state);
  } catch (err) {
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
}
