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
  }
}

export const zustandLocalStorage: StateStorage = {
  getItem: (name) => safeGetItem(name),
  setItem: (name, value) => {
    safeSetItem(name, value);
  },
  removeItem: (name) => safeRemoveItem(name),
};

export const guestOnlyLocalStorage: StateStorage = {
  getItem: (name) => safeGetItem(name),
  setItem: (name, value) => {
    if (useAuthStore.getState().status === "authenticated") return;
    safeSetItem(name, value);
  },
  removeItem: (name) => safeRemoveItem(name),
};
