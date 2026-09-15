"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/utils";
import { APP_BRAND } from "@/lib/constants/branding";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  );
}

/**
 * Shown until the app is actually installed. Uses the native one-click prompt when the browser
 * has already offered one; otherwise falls back to pointing the user at their browser's own
 * install UI — `beforeinstallprompt` firing at all is gated by undocumented Chrome engagement
 * heuristics, so waiting for it before showing anything can mean the button never appears at all.
 */
export function InstallAppButton({ iconOnly = false }: { iconOnly?: boolean }) {
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
    <Button
      size={iconOnly ? "icon-lg" : "sm"}
      variant="outline"
      className={cn(
        "border-primary/20 bg-background/80 text-primary hover:border-primary/35 hover:bg-primary/8 shadow-xs",
        iconOnly
          ? "size-11 rounded-lg"
          : "h-8 gap-1.5 rounded-lg px-2.5 text-xs",
      )}
      onClick={() => void handleClick()}
      aria-label={iconOnly ? `Install ${APP_BRAND.name} app` : undefined}
      title={iconOnly ? `Install ${APP_BRAND.name} app` : undefined}
    >
      <Download className="size-3.5" />
      {!iconOnly && "Install App"}
    </Button>
  );
}
