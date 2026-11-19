"use client";

import { useState } from "react";
import { AppLogo } from "@/components/ui/AppLogo";
import { hasSignedInHint, useAuthStore } from "@/store/authStore";

/**
 * Covers the app while a signed-in user's Drive workspace loads, so leftover
 * guest notes (Welcome.txt, guest tabs) never flash on screen. Sits below
 * dialogs (z-50) so the first-sign-in "copy guest notes" prompt stays usable.
 */
export function DriveLoadingScreen() {
  const status = useAuthStore((s) => s.status);
  const workspaceReady = useAuthStore((s) => s.workspaceReady);
  const [signedInHint] = useState(hasSignedInHint);
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const loading =
    (status === "loading" && signedInHint) ||
    (status === "authenticated" && !workspaceReady);

  if (loading && !shown) setShown(true);
  if (!shown || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!loading}
      onTransitionEnd={() => {
        if (!loading) setDismissed(true);
      }}
      className={`bg-background text-foreground fixed inset-0 z-40 flex flex-col items-center justify-center px-6 transition-opacity duration-300 ease-out select-none ${
        loading ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="animate-in fade-in zoom-in-95 flex flex-col items-center duration-500">
        <div className="relative">
          <span
            aria-hidden="true"
            className="border-primary/25 absolute -inset-3 rounded-[22px] border motion-safe:animate-ping motion-safe:[animation-duration:2.2s]"
          />
          <AppLogo size="xl" priority className="relative shadow-xl" />
          <span className="bg-card border-border absolute -right-2.5 -bottom-2.5 flex size-8 items-center justify-center rounded-xl border shadow-md">
            <DriveIcon />
          </span>
        </div>

        <p className="mt-10 text-base font-semibold tracking-tight">
          Loading your files from Google Drive
        </p>
        <p className="text-muted-foreground mt-1.5 text-sm">
          This only takes a moment
        </p>

        <div
          aria-hidden="true"
          className="bg-muted mt-7 h-1 w-48 overflow-hidden rounded-full"
        >
          <div className="np-indeterminate-bar h-full w-2/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function DriveIcon() {
  return (
    <svg viewBox="0 0 87.3 78" className="size-4" aria-hidden="true">
      <path
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
        fill="#0066da"
      />
      <path
        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
        fill="#00ac47"
      />
      <path
        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
        fill="#ea4335"
      />
      <path
        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
        fill="#00832d"
      />
      <path
        d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        fill="#2684fc"
      />
      <path
        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
        fill="#ffba00"
      />
    </svg>
  );
}
