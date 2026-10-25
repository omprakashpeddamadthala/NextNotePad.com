import { SignJWT, jwtVerify } from "jose";
import { resolveJwtSecret } from "./jwtSecret";

const SESSION_COOKIE_NAME = "np_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;

function getSecretKey(): Uint8Array {
  return resolveJwtSecret({
    name: "session",
    derivedPrefix: "np-secret-",
    fallback: "nextnotepad-default-session-jwt-secret-key-32bytes",
  });
}

export interface SessionPayload {
  userId: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };
