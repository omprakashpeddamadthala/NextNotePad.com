import { create } from "zustand";
import { fetchJson } from "@/lib/api/fetchJson";
import type { AuthUser } from "./authStore";

export type LockPolicy = "next_visit" | "new_day" | "immediate";

export interface LockConfig {
  enabled: boolean;
  policy: LockPolicy;
  pwaOnResume: boolean;
  autoTimeoutMinutes: number;
}

interface LockState {
  enabled: boolean;
  isLocked: boolean;
  policy: LockPolicy;
  pwaOnResume: boolean;
  autoTimeoutMinutes: number;
  privacyShieldVisible: boolean;
  lastActivityAt: number;

  setLockConfig: (config: Partial<LockConfig & { isLocked?: boolean }>) => void;
  setLocked: (locked: boolean) => void;
  unlock: (user: AuthUser) => void;
  lock: () => Promise<void>;
  recordActivity: () => void;
  setPrivacyShieldVisible: (visible: boolean) => void;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const SESSION_STORAGE_KEY = "np_unlocked_session";

function markSessionUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
  } catch {}
}

function clearSessionUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
}

export const useLockStore = create<LockState>()((set) => ({
  enabled: false,
  isLocked: false,
  policy: "next_visit",
  pwaOnResume: true,
  autoTimeoutMinutes: 0,
  privacyShieldVisible: false,
  lastActivityAt: Date.now(),

  setLockConfig: (config) =>
    set((state) => ({
      enabled: config.enabled ?? state.enabled,
      isLocked: config.isLocked ?? state.isLocked,
      policy: config.policy ?? state.policy,
      pwaOnResume: config.pwaOnResume ?? state.pwaOnResume,
      autoTimeoutMinutes: config.autoTimeoutMinutes ?? state.autoTimeoutMinutes,
    })),

  setLocked: (locked) => {
    if (locked) {
      clearSessionUnlocked();
    }
    set({ isLocked: locked });
  },

  unlock: () => {
    markSessionUnlocked();
    set({ isLocked: false, lastActivityAt: Date.now() });
  },

  lock: async () => {
    clearSessionUnlocked();
    set({ isLocked: true });
    try {
      await fetchJson("/api/lock/lock", { method: "POST", action: "Lock application" });
    } catch (err) {
      console.warn("[lockStore] Error notifying server of lock:", err);
    }
  },

  recordActivity: () => {
    set({ lastActivityAt: Date.now() });
  },

  setPrivacyShieldVisible: (visible) => {
    set({ privacyShieldVisible: visible });
  },
}));
