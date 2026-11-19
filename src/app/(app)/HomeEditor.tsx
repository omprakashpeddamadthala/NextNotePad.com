"use client";

import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PasswordLockScreen } from "@/components/lock/PasswordLockScreen";
import { useLockStore } from "@/store/lockStore";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";

function subscribeNever() {
  return () => {};
}

export function HomeEditor() {
  const isLocked = useLockStore((s) => s.isLocked);

  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className="text-foreground flex h-full min-h-screen flex-1 flex-col items-center justify-center bg-[#0e0f12] select-none"
        suppressHydrationWarning
      >
        <div className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-4 duration-300">
          <div className="relative">
            <div className="absolute -inset-2 animate-pulse rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 blur-md" />
            <AppLogo size="xl" priority className="relative shadow-2xl" />
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="font-heading flex items-center gap-1 text-lg font-semibold tracking-tight text-white">
              <span>{APP_BRAND.name}</span>
              <span className="text-primary text-xs font-semibold">.com</span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              {APP_BRAND.shortTagline}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
            <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
            <span className="bg-primary size-1.5 animate-bounce rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <ErrorBoundary>
        <PasswordLockScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
