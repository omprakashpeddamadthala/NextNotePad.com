"use client";

import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function subscribeNever() {
  return () => {};
}

/**
 * Zustand's persist middleware rehydrates from localStorage synchronously on
 * the client but not during SSR — rendering AppShell only after mount keeps
 * the server/first-client-paint HTML identical (both show the loader),
 * avoiding a hydration mismatch on every persisted store.
 */
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";

export default function Home() {
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className="bg-[#0e0f12] text-foreground flex h-full min-h-screen flex-1 flex-col items-center justify-center select-none"
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-2xl blur-md animate-pulse" />
            <AppLogo size="xl" priority className="relative shadow-2xl" />
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="font-heading text-lg font-semibold tracking-tight text-white flex items-center gap-1">
              <span>{APP_BRAND.name}</span>
              <span className="text-primary text-xs font-semibold">.com</span>
            </h1>
            <p className="text-xs text-white/60 mt-1">
              {APP_BRAND.shortTagline}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="size-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
