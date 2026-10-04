import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  decodeIdTokenProfile,
  DRIVE_FILE_SCOPE,
  fetchGoogleProfile,
  getAppOrigin,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth/google";
import {
  signSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

function safeErrorCode(err: unknown): string {
  if (!err || typeof err !== "object") return "unknown";
  const e = err as {
    code?: unknown;
    message?: unknown;
    cause?: { code?: unknown };
  };
  if (typeof e.code === "string" && e.code) return e.code;
  if (typeof e.cause?.code === "string" && e.cause.code) return e.cause.code;
  const msg = typeof e.message === "string" ? e.message : "";
  const google = msg.match(/failed: (\d{3})[\s\S]*?"error"\s*:\s*"([a-z_]+)"/i);
  if (google) return `${google[1]} ${google[2]}`;
  const status = msg.match(/failed: (\d{3})/);
  if (status) return status[1];
  return (err as Error).name || "unknown";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  const appOrigin = getAppOrigin(request);

  if (oauthError) {
    const res = NextResponse.redirect(
      new URL(`/?authError=${encodeURIComponent(oauthError)}`, appOrigin),
    );
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    console.error("[api/auth/google/callback] OAuth validation failed:", {
      hasCode: !!code,
      hasState: !!state,
      hasExpectedState: !!expectedState,
      stateMatch: state === expectedState,
    });
    const res = NextResponse.redirect(
      new URL("/?authError=invalid_state", appOrigin),
    );
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }

  let stage = "token";
  try {
    const tokens = await exchangeCodeForTokens(code);
    // Google's consent screen lets users untick the Drive permission. Without it every Drive call
    // fails, so refuse the sign-in up front and tell them to grant it.
    if (tokens.scope && !tokens.scope.split(" ").includes(DRIVE_FILE_SCOPE)) {
      const res = NextResponse.redirect(
        new URL("/?authError=drive_scope_missing", appOrigin),
      );
      res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      return res;
    }
    stage = "profile";
    const profile = tokens.id_token
      ? decodeIdTokenProfile(tokens.id_token)
      : await fetchGoogleProfile(tokens.access_token);

    stage = "db";
    const user = await prisma.user.upsert({
      where: { googleId: profile.sub },
      update: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        googleAccessToken: tokens.access_token,
        ...(tokens.refresh_token
          ? { googleRefreshToken: tokens.refresh_token }
          : {}),
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

    stage = "session";
    const sessionToken = await signSessionToken({ userId: user.id });
    const isHttps = appOrigin.startsWith("https");

    const response = NextResponse.redirect(new URL("/", appOrigin));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error(`Google OAuth callback failed at stage "${stage}":`, err);
    const reason = `${stage}:${safeErrorCode(err)}`;
    const res = NextResponse.redirect(
      new URL(
        `/?authError=oauth_failed&authReason=${encodeURIComponent(reason)}`,
        appOrigin,
      ),
    );
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }
}
