const warned = new Set<string>();

/**
 * Resolves the HMAC key for a family of JWTs (session, unlock). Prefers `JWT_SECRET`; the
 * DATABASE_PASSWORD-derived and hardcoded fallbacks exist only so older deployments keep their
 * existing tokens valid. Both fallbacks are guessable, so production logs a warning once per key.
 */
export function resolveJwtSecret(options: {
  name: string;
  derivedPrefix: string;
  fallback: string;
}): Uint8Array {
  const { name, derivedPrefix, fallback } = options;
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    const dbPassword = process.env.DATABASE_PASSWORD;
    secret = dbPassword ? `${derivedPrefix}${dbPassword}` : fallback;
    if (process.env.NODE_ENV === "production" && !warned.has(name)) {
      warned.add(name);
      console.warn(
        `[auth] JWT_SECRET is not set — ${name} tokens are signed with a ${
          dbPassword ? "DATABASE_PASSWORD-derived" : "built-in default"
        } key. Set JWT_SECRET to a random value (openssl rand -base64 32).`,
      );
    }
  }
  return new TextEncoder().encode(secret);
}
