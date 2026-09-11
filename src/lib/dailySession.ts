/**
 * Daily-session stamp helpers.
 *
 * On every first page load of a new calendar day we force a full re-login so
 * authenticated users always get a fresh copy of their workspace data.
 * The stamp is a plain `YYYY-MM-DD` string stored in localStorage.
 */

const STAMP_KEY = "np-daily-stamp";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Returns `true` when the stored date is missing or older than today. */
export function isDailyResetNeeded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STAMP_KEY) !== todayISO();
  } catch {
    return false;
  }
}

/** Writes today's date so the reset is not triggered again until tomorrow. */
export function markDailyStamp(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STAMP_KEY, todayISO());
  } catch {
    // quota exceeded — non-fatal
  }
}

/** Removes the stamp (used during cache-clear so it is re-set after re-login). */
export function clearDailyStamp(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STAMP_KEY);
  } catch {
    // ignore
  }
}
