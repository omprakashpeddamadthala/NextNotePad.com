"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

/**
 * Shown until the app is actually installed. Uses the native one-click prompt when the browser
 * has already offered one; otherwise falls back to pointing the user at their browser's own
 * install UI — `beforeinstallprompt` firing at all is gated by undocumented Chrome engagement
 * heuristics, so waiting for it before showing anything can mean the button never appears at all.
 */
import { APP_BRAND } from "@/lib/constants/branding";

export function InstallAppButton() {
  const { installed, hasNativePrompt, promptInstall } = useInstallPrompt();

  if (installed) return null;

  async function handleClick() {
    if (hasNativePrompt) {
      await promptInstall();
      return;
    }
    if (isIOS()) {
      toast.info(`Tap the Share icon, then "Add to Home Screen" to install ${APP_BRAND.name}.`);
      return;
    }
    toast.info(
      `Look for an install icon in your address bar, or browser menu for "Install ${APP_BRAND.name}".`,
    );
  }

  return (
    <Button size="sm" variant="outline" className="h-6 gap-1.5 px-2 text-xs" onClick={() => void handleClick()}>
      <Download className="size-3.5" /> Install App
    </Button>
  );
}
