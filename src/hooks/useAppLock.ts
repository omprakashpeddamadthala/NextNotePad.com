"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLockStore, getTodayDateString } from "@/store/lockStore";
import { useAuthStore } from "@/store/authStore";

const THROTTLE_ACTIVITY_MS = 2000;
const PWA_BACKGROUND_LOCK_THRESHOLD_MS = 1500;

export function useAppLock(): void {
  const enabled = useLockStore((s) => s.enabled);
  const isLocked = useLockStore((s) => s.isLocked);
  const policy = useLockStore((s) => s.policy);
  const pwaOnResume = useLockStore((s) => s.pwaOnResume);
  const autoTimeoutMinutes = useLockStore((s) => s.autoTimeoutMinutes);
  const lock = useLockStore((s) => s.lock);
  const recordActivity = useLockStore((s) => s.recordActivity);
  const setPrivacyShieldVisible = useLockStore((s) => s.setPrivacyShieldVisible);
  const authStatus = useAuthStore((s) => s.status);

  const lastActivityTimeRef = useRef(Date.now());
  const backgroundedAtRef = useRef<number | null>(null);
  const unlockedDateRef = useRef(getTodayDateString());

  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityTimeRef.current >= THROTTLE_ACTIVITY_MS) {
      lastActivityTimeRef.current = now;
      recordActivity();
    }
  }, [recordActivity]);

  // Activity tracking for idle auto-lock
  useEffect(() => {
    if (!enabled || isLocked || autoTimeoutMinutes <= 0) return;

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((ev) =>
      window.addEventListener(ev, handleUserActivity, { passive: true }),
    );

    const idleInterval = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityTimeRef.current;
      const timeoutMs = autoTimeoutMinutes * 60 * 1000;
      if (elapsed >= timeoutMs) {
        void lock();
      }
    }, 10000);

    return () => {
      events.forEach((ev) =>
        window.removeEventListener(ev, handleUserActivity),
      );
      window.clearInterval(idleInterval);
    };
  }, [enabled, isLocked, autoTimeoutMinutes, handleUserActivity, lock]);

  // PWA background / resume & App Switcher privacy shield
  useEffect(() => {
    if (!enabled || authStatus !== "authenticated") return;

    function isPWA(): boolean {
      if (typeof window === "undefined") return false;
      const standaloneQuery = window.matchMedia("(display-mode: standalone)").matches;
      const navStandalone = (
        window.navigator as unknown as { standalone?: boolean }
      ).standalone === true;
      return standaloneQuery || navStandalone;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        backgroundedAtRef.current = Date.now();
        // Immediately shield the UI from the OS application switcher preview
        setPrivacyShieldVisible(true);
      } else if (document.visibilityState === "visible") {
        // App resumed into foreground
        setPrivacyShieldVisible(false);

        if (isLocked) return;

        const bgTime = backgroundedAtRef.current;
        backgroundedAtRef.current = null;

        // Check if calendar day changed for "new_day" policy
        if (policy === "new_day") {
          const today = getTodayDateString();
          if (today !== unlockedDateRef.current) {
            void lock();
            return;
          }
        }

        // PWA resume lock
        if (isPWA() && pwaOnResume && bgTime) {
          const awayDuration = Date.now() - bgTime;
          if (awayDuration >= PWA_BACKGROUND_LOCK_THRESHOLD_MS) {
            void lock();
          }
        }
      }
    }

    function handleWindowBlur() {
      if (isPWA() && enabled) {
        setPrivacyShieldVisible(true);
      }
    }

    function handleWindowFocus() {
      setPrivacyShieldVisible(false);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [enabled, isLocked, policy, pwaOnResume, authStatus, lock, setPrivacyShieldVisible]);

  // Keyboard shortcut Ctrl+Alt+L for immediate lock
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        (e.key === "l" || e.key === "L")
      ) {
        e.preventDefault();
        if (enabled && !isLocked) {
          void lock();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isLocked, lock]);
}
