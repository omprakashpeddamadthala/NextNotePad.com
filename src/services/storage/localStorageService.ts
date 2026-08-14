import type { StateStorage } from "zustand/middleware";
import { useAuthStore } from "@/store/authStore";

const isBrowser = typeof window !== "undefined";

function safeGetItem(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`Failed to persist "${key}" to localStorage (quota exceeded?)`, err);
    return false;
  }
}

function safeRemoveItem(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Zustand `persist` storage engine backed by the safe wrappers above. */
export const zustandLocalStorage: StateStorage = {
  getItem: (name) => safeGetItem(name),
  setItem: (name, value) => {
    safeSetItem(name, value);
  },
  removeItem: (name) => safeRemoveItem(name),
};

/**
 * Same as `zustandLocalStorage`, but skips writes while a cloud session is active — the
 * in-memory store switches to holding cloud data after login, and this keeps the guest
 * snapshot in localStorage frozen/untouched underneath it (restored on sign-out via reload).
 */
export const guestOnlyLocalStorage: StateStorage = {
  getItem: (name) => safeGetItem(name),
  setItem: (name, value) => {
    if (useAuthStore.getState().status === "authenticated") return;
    safeSetItem(name, value);
  },
  removeItem: (name) => safeRemoveItem(name),
};
