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
  const appOrigin = getAppOrigin(request);

  if (oauthError) {
    const res = NextResponse.redirect(new URL(`/?authError=${encodeURIComponent(oauthError)}`, appOrigin));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    const res = NextResponse.redirect(new URL("/?authError=invalid_state", appOrigin));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
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

    // Ensure the user has at least one workspace (their "My Workspace" default).
    // We find-or-create because userId is no longer unique (multi-workspace support).
    const existingWorkspace = await prisma.workspace.findFirst({ where: { userId: user.id } });
    let workspaceId: string;
    if (existingWorkspace) {
      workspaceId = existingWorkspace.id;
    } else {
      const created = await prisma.workspace.create({ data: { userId: user.id, name: "My Workspace" } });
      workspaceId = created.id;
    }

    // Ensure the user's activeWorkspaceId is set (may be null for very old rows).
    if (!user.activeWorkspaceId) {
      await prisma.user.update({ where: { id: user.id }, data: { activeWorkspaceId: workspaceId } });
    }


    const sessionToken = await signSessionToken({ userId: user.id });
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });

    const response = NextResponse.redirect(new URL("/", appOrigin));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    const res = NextResponse.redirect(new URL("/?authError=oauth_failed", appOrigin));
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }
}
