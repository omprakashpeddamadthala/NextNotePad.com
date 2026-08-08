import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, decodeIdTokenProfile, fetchGoogleProfile, getAppOrigin, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/google";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  const appOrigin = getAppOrigin();

  if (oauthError) {
    return NextResponse.redirect(new URL(`/?authError=${encodeURIComponent(oauthError)}`, appOrigin));
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?authError=invalid_state", appOrigin));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = tokens.id_token ? decodeIdTokenProfile(tokens.id_token) : await fetchGoogleProfile(tokens.access_token);

    const user = await prisma.user.upsert({
      where: { googleId: profile.sub },
      update: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        googleAccessToken: tokens.access_token,
        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
        googleTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    await prisma.workspace.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const sessionToken = await signSessionToken({ userId: user.id });
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });

    return NextResponse.redirect(new URL("/", appOrigin));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/?authError=oauth_failed", appOrigin));
  }
}
