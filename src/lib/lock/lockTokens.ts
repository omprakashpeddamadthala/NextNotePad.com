import { SignJWT, jwtVerify } from "jose";

export const UNLOCK_COOKIE_NAME = "np_unlocked";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.DATABASE_PASSWORD
      ? `np-lock-secret-${process.env.DATABASE_PASSWORD}`
      : undefined) ||
    "nextnotepad-default-lock-jwt-secret-key-32bytes";
  return new TextEncoder().encode(secret);
}

export interface UnlockTokenPayload {
  userId: string;
  unlockedAt: number;
  unlockedDate: string; // "YYYY-MM-DD"
  policy: string;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Signs an unlock session JWT token.
 */
export async function signUnlockToken(
  payload: Omit<UnlockTokenPayload, "unlockedAt" | "unlockedDate"> & {
    unlockedDate?: string;
  },
): Promise<string> {
  const unlockedAt = Date.now();
  const unlockedDate = payload.unlockedDate || getTodayDateString();

  return new SignJWT({
    userId: payload.userId,
    policy: payload.policy,
    unlockedAt,
    unlockedDate,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

/**
 * Verifies an unlock session JWT token and returns the payload if valid.
 */
export async function verifyUnlockToken(
  token: string,
): Promise<UnlockTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.policy !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      policy: payload.policy,
      unlockedAt: typeof payload.unlockedAt === "number" ? payload.unlockedAt : Date.now(),
      unlockedDate:
        typeof payload.unlockedDate === "string"
          ? payload.unlockedDate
          : getTodayDateString(),
    };
  } catch {
    return null;
  }
}
