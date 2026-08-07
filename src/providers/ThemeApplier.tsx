"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { THEME_MODULES } from "@/lib/monaco/themes";

/** Pushes the active theme's colors onto :root as CSS custom properties, live, no reload needed. */
export function ThemeApplier() {
  const themeName = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const theme = THEME_MODULES[themeName];
    if (!theme) return;
    const root = document.documentElement;
    const { chrome } = theme;

    root.classList.toggle("dark", chrome.isDark);
    root.setAttribute("data-np-theme", theme.id);

    const shadcnVars: Record<string, string> = {
      "--background": chrome.background,
      "--foreground": chrome.foreground,
      "--card": chrome.panel,
      "--card-foreground": chrome.foreground,
      "--popover": chrome.panel,
      "--popover-foreground": chrome.foreground,
      "--primary": chrome.accent,
      "--primary-foreground": chrome.accentForeground,
      "--secondary": chrome.tabInactiveBackground,
      "--secondary-foreground": chrome.foreground,
      "--muted": chrome.panel,
      "--muted-foreground": chrome.foreground,
      "--accent": chrome.menuHover,
      "--accent-foreground": chrome.foreground,
      "--border": chrome.panelBorder,
      "--input": chrome.panelBorder,
      "--ring": chrome.accent,
    };

    const chromeVars: Record<string, string> = {
      "--np-toolbar-bg": chrome.toolbarBackground,
      "--np-statusbar-bg": chrome.statusBarBackground,
      "--np-statusbar-fg": chrome.statusBarForeground,
      "--np-tab-active-bg": chrome.tabActiveBackground,
      "--np-tab-inactive-bg": chrome.tabInactiveBackground,
      "--np-tab-border": chrome.tabBorder,
      "--np-scrollbar": chrome.scrollbar,
      "--np-menu-hover": chrome.menuHover,
    };

    for (const [key, value] of Object.entries({ ...shadcnVars, ...chromeVars })) {
      root.style.setProperty(key, value);
    }
  }, [themeName]);

  return null;
}
