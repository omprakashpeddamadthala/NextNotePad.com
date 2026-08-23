"use client";

import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";

function subscribeNever() {
  return () => {};
}

/**
 * Zustand's persist middleware rehydrates from localStorage synchronously on
 * the client but not during SSR — rendering AppShell only after mount keeps
 * the server/first-client-paint HTML identical (both show the loader),
 * avoiding a hydration mismatch on every persisted store.
 */
export default function Home() {
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className="bg-background text-muted-foreground flex h-full flex-1 items-center justify-center text-sm"
        suppressHydrationWarning
      >
        Loading NextNotePad.com…
      </div>
    );
  }

  return <AppShell />;
}
