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
        iconOnly
          ? "border-primary/20 bg-background/80 text-primary hover:border-primary/35 hover:bg-primary/8 shadow-xs size-11 rounded-lg"
          : "border-border/40 bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40 h-7 gap-1.5 rounded-lg px-2 text-[11px] font-medium shadow-none",
      )}
      onClick={() => void handleClick()}
      aria-label={`Install ${APP_BRAND.name} app`}
      title={`Install ${APP_BRAND.name} app`}
    >
      <Download className="size-3.5" />
      {!iconOnly && <span className="hidden 2xl:inline">Install App</span>}
    </Button>
  );
}
