import { NextResponse } from "next/server";
import type { UserModel } from "@/generated/prisma/models";
import { isBootstrapAdmin } from "@/lib/auth/admin";
import { UNLOCK_COOKIE_NAME } from "./lockTokens";
import {
  DEFAULT_AUTO_TIMEOUT_MINUTES,
  DEFAULT_LOCK_POLICY,
  DEFAULT_PWA_ON_RESUME,
  isSessionOnlyPolicy,
} from "./lockPolicy";
import type { UserLockRecord } from "./lockService";

const UNLOCK_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function setUnlockCookie(
  response: NextResponse,
  unlockToken: string,
  policy: string | null | undefined,
): void {
  response.cookies.set(UNLOCK_COOKIE_NAME, unlockToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(isSessionOnlyPolicy(policy)
      ? {}
      : { maxAge: UNLOCK_COOKIE_MAX_AGE_SECONDS }),
  });
}

/** Lock state as reported to the client by /api/auth/me and /api/lock/status. */
export function toLockInfo(record: UserLockRecord | null, isLocked: boolean) {
  return {
    enabled: record?.lockEnabled ?? false,
    isLocked,
    policy: record?.lockPolicy || DEFAULT_LOCK_POLICY,
    pwaOnResume: record?.lockPwaOnResume ?? DEFAULT_PWA_ON_RESUME,
    autoTimeoutMinutes:
      record?.lockAutoTimeoutMinutes ?? DEFAULT_AUTO_TIMEOUT_MINUTES,
  };
}

/** The signed-in user's public profile, as returned once the app is unlocked. */
export function toAuthUser(user: UserModel) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isAdmin: Boolean(user.isAdmin || isBootstrapAdmin(user.email)),
  };
}

/** Logs the real error server-side and returns a generic message, so internals never leak. */
export function lockServerError(
  scope: string,
  err: unknown,
  message: string,
): NextResponse {
  console.error(`[api/lock/${scope}]`, err);
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function lockFailure(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}
