// Pure lock-policy rules shared by the server (API routes, lockService) and the client (lockStore,
// useAppLock). Must stay free of server-only and browser-only imports.

export const LOCK_POLICIES = ["next_visit", "new_day", "immediate"] as const;
export type LockPolicy = (typeof LOCK_POLICIES)[number];

export const DEFAULT_LOCK_POLICY: LockPolicy = "next_visit";
export const DEFAULT_PWA_ON_RESUME = true;
export const DEFAULT_AUTO_TIMEOUT_MINUTES = 0;
export const MAX_AUTO_TIMEOUT_MINUTES = 24 * 60;

export interface LockOptions {
  policy?: LockPolicy;
  pwaOnResume?: boolean;
  autoTimeoutMinutes?: number;
}

export function isLockPolicy(value: unknown): value is LockPolicy {
  return (
    typeof value === "string" &&
    (LOCK_POLICIES as readonly string[]).includes(value)
  );
}

/**
 * Keeps only the well-formed lock options from an untrusted request body. Anything missing or
 * invalid comes back `undefined`, so callers decide whether that means "keep current" or "default".
 */
export function sanitizeLockOptions(input: {
  policy?: unknown;
  pwaOnResume?: unknown;
  autoTimeoutMinutes?: unknown;
}): LockOptions {
  const { policy, pwaOnResume, autoTimeoutMinutes } = input;
  return {
    policy: isLockPolicy(policy) ? policy : undefined,
    pwaOnResume: typeof pwaOnResume === "boolean" ? pwaOnResume : undefined,
    autoTimeoutMinutes:
      typeof autoTimeoutMinutes === "number" &&
      autoTimeoutMinutes >= 0 &&
      autoTimeoutMinutes <= MAX_AUTO_TIMEOUT_MINUTES
        ? Math.floor(autoTimeoutMinutes)
        : undefined,
  };
}

/** "Next visit" unlocks last only for the browser session, so the cookie gets no max-age. */
export function isSessionOnlyPolicy(
  policy: string | null | undefined,
): boolean {
  return (policy || DEFAULT_LOCK_POLICY) === "next_visit";
}

/** Today's date in UTC as "YYYY-MM-DD" — the unit the "new_day" policy compares. */
export function getTodayDateString(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
