"use client";

import { useCallback, useEffect, useState } from "react";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

/**
 * Wraps the browser's PWA install flow (`beforeinstallprompt`/`appinstalled`, Chromium-only).
 *
 * `beforeinstallprompt` firing at all is subject to Chrome's own opaque, undocumented engagement
 * heuristics — a button that only appears once that event has fired can end up simply never
 * showing up, which reads as "broken" even when the app is perfectly installable. So the button
 * built on this hook stays visible (via `installed`, not `canInstall`) the whole time the app
 * isn't installed; `hasNativePrompt` just tells the caller whether a real one-click install is
 * available right now, or whether to fall back to pointing the user at their browser's own menu.
 *
 * `installed` flips permanently once installed — checked via the `appinstalled` event and
 * `display-mode: standalone` on load, so a returning installed user never sees the button again.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Lazy initializer, not an effect: `isStandalone()` only reflects the *server* environment
  // (always false, no `window`) during SSR, but that's fine — the button's rendered output on
  // first paint is identical either way (it's always "visible" until this resolves client-side).
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
      event.preventDefault();
      setDeferredPrompt(event);
    }
    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  return {
    installed,
    hasNativePrompt: deferredPrompt !== null,
    promptInstall,
  };
}
