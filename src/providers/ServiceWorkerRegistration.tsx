"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker — in every environment, not just production. Chrome
 * won't fire `beforeinstallprompt` (which `useInstallPrompt`/the "Install App" button needs)
 * without an active SW, so skipping registration in dev would make that button untestable
 * outside a production build. In dev, `sw.js?dev=1` tells the worker to skip all caching (see
 * its comment) so it satisfies the installability check without fighting Fast Refresh/HMR.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
    navigator.serviceWorker.register(url).catch(() => {
      // Best-effort — the app works fine without it, just without offline app-shell caching
      // (and without the install-prompt button, which needs an active SW to ever fire).
    });
  }, []);

  return null;
}
