import { create } from "zustand";
import { fetchJson } from "@/lib/api/fetchJson";
import {
  DEFAULT_AUTO_TIMEOUT_MINUTES,
  DEFAULT_LOCK_POLICY,
  DEFAULT_PWA_ON_RESUME,
  getTodayDateString,
  type LockPolicy,
} from "@/lib/lock/lockPolicy";
import type { AuthUser } from "./authStore";

export { getTodayDateString, type LockPolicy };

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
  policy: DEFAULT_LOCK_POLICY,
  pwaOnResume: DEFAULT_PWA_ON_RESUME,
  autoTimeoutMinutes: DEFAULT_AUTO_TIMEOUT_MINUTES,
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
