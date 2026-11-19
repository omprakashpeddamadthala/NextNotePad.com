"use client";

import { useEffect } from "react";

/** Time for the editor to finish loading before listing what to keep offline. */
const CACHE_AFTER_LOAD_MS = 8000;

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const isProduction = process.env.NODE_ENV === "production";
    const url = isProduction ? "/sw.js" : "/sw.js?dev=1";
    navigator.serviceWorker.register(url).catch(() => {
    });
    if (!isProduction) return;

    // Files loaded on the very first visit came from the network before the
    // worker was active; hand their URLs over so it can keep copies.
    const timer = setTimeout(() => {
      void navigator.serviceWorker.ready.then((registration) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name);
        registration.active?.postMessage({ type: "cache-assets", urls });
      });
    }, CACHE_AFTER_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
