import { SignJWT, jwtVerify } from "jose";
import { resolveJwtSecret } from "@/lib/auth/jwtSecret";
import { getTodayDateString } from "./lockPolicy";

export { getTodayDateString };

export const UNLOCK_COOKIE_NAME = "np_unlocked";

function getSecretKey(): Uint8Array {
  return resolveJwtSecret({
    name: "unlock",
    derivedPrefix: "np-lock-secret-",
    fallback: "nextnotepad-default-lock-jwt-secret-key-32bytes",
  });
}

export interface UnlockTokenPayload {
  userId: string;
  unlockedAt: number;
  unlockedDate: string; // "YYYY-MM-DD"
  policy: string;
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
